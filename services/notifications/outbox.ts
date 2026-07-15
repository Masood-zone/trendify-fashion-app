import { after } from "next/server"

import {
  NotificationChannel,
  NotificationDeliveryStatus,
  type NotificationTemplate,
} from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import {
  notificationDeliveryEnabled,
  sendEmail,
  sendSms,
} from "@/services/notifications/providers"
import {
  renderOutboundMessage,
  type OutboundPayload,
} from "@/services/notifications/templates"

const MAX_ATTEMPTS = 5
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000]
const STALE_PROCESSING_MS = 10 * 60_000

type DeliveryWriter = {
  notificationDelivery: {
    createMany(args: {
      data: Array<{
        eventKey: string
        channel: NotificationChannel
        template: NotificationTemplate
        recipient: string
        payload: OutboundPayload
      }>
      skipDuplicates?: boolean
    }): Promise<{ count: number }>
  }
}

export type EnqueueNotificationInput = {
  eventKey: string
  template: NotificationTemplate
  email?: string | null
  phone?: string | null
  payload: OutboundPayload
}

export async function enqueueNotificationDeliveries(
  writer: DeliveryWriter,
  input: EnqueueNotificationInput
) {
  const payload = JSON.parse(JSON.stringify(input.payload)) as OutboundPayload
  const data = []
  if (input.email) {
    data.push({
      eventKey: input.eventKey,
      channel: NotificationChannel.EMAIL,
      template: input.template,
      recipient: input.email.trim().toLowerCase(),
      payload,
    })
  }
  if (input.phone) {
    data.push({
      eventKey: input.eventKey,
      channel: NotificationChannel.SMS,
      template: input.template,
      recipient: input.phone,
      payload,
    })
  }
  if (!data.length) return 0
  return (
    await writer.notificationDelivery.createMany({
      data,
      skipDuplicates: true,
    })
  ).count
}

export function retryDelayMs(attempts: number) {
  return RETRY_DELAYS_MS[Math.min(Math.max(attempts - 1, 0), RETRY_DELAYS_MS.length - 1)]
}

export function sanitizeDeliveryError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown notification provider error"
  return message.replace(/[\r\n]+/g, " ").slice(0, 1_000)
}

export function scheduleNotificationDelivery(eventKeys: string[]) {
  const uniqueKeys = [...new Set(eventKeys)]
  if (!uniqueKeys.length) return
  const task = () =>
    dispatchNotificationDeliveries({ eventKeys: uniqueKeys }).catch((error) => {
      console.error("Notification background delivery failed", error)
    })
  try {
    after(task)
  } catch {
    void task()
  }
}

export async function dispatchNotificationDeliveries(options?: {
  eventKeys?: string[]
  limit?: number
  now?: Date
}) {
  const result = {
    examined: 0,
    sent: 0,
    retried: 0,
    terminalFailures: 0,
  }
  if (!notificationDeliveryEnabled()) return result

  const now = options?.now || new Date()
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS)
  await prisma.notificationDelivery.updateMany({
    where: {
      status: NotificationDeliveryStatus.PROCESSING,
      processingStartedAt: { lte: staleBefore },
    },
    data: {
      status: NotificationDeliveryStatus.FAILED,
      processingStartedAt: null,
      nextAttemptAt: now,
      lastError: "Delivery worker stopped before reporting a result",
    },
  })

  const candidates = await prisma.notificationDelivery.findMany({
    where: {
      status: {
        in: [NotificationDeliveryStatus.PENDING, NotificationDeliveryStatus.FAILED],
      },
      attempts: { lt: MAX_ATTEMPTS },
      nextAttemptAt: { lte: now },
      ...(options?.eventKeys?.length ? { eventKey: { in: options.eventKeys } } : {}),
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: Math.min(Math.max(options?.limit || 50, 1), 100),
  })
  result.examined = candidates.length

  for (const candidate of candidates) {
    const claim = await prisma.notificationDelivery.updateMany({
      where: {
        id: candidate.id,
        status: candidate.status,
        attempts: candidate.attempts,
      },
      data: {
        status: NotificationDeliveryStatus.PROCESSING,
        processingStartedAt: now,
        attempts: { increment: 1 },
      },
    })
    if (!claim.count) continue
    const delivery = await prisma.notificationDelivery.findUniqueOrThrow({
      where: { id: candidate.id },
    })
    try {
      const message = await renderOutboundMessage(
        delivery.template,
        delivery.payload as OutboundPayload
      )
      const providerMessageId =
        delivery.channel === NotificationChannel.EMAIL
          ? await sendEmail({
              to: delivery.recipient,
              subject: message.subject,
              html: message.html,
              text: message.text,
            })
          : await sendSms({ to: delivery.recipient, message: message.sms })
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationDeliveryStatus.SENT,
          providerMessageId,
          sentAt: new Date(),
          processingStartedAt: null,
          lastError: null,
        },
      })
      result.sent += 1
    } catch (error) {
      const terminal = delivery.attempts >= MAX_ATTEMPTS
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationDeliveryStatus.FAILED,
          processingStartedAt: null,
          nextAttemptAt: terminal
            ? now
            : new Date(now.getTime() + retryDelayMs(delivery.attempts)),
          lastError: sanitizeDeliveryError(error),
        },
      })
      if (terminal) result.terminalFailures += 1
      else result.retried += 1
    }
  }
  return result
}
