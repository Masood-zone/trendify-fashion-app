import { randomUUID } from "node:crypto"

import type { NotificationTemplate } from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import {
  enqueueNotificationDeliveries,
  scheduleNotificationDelivery,
} from "@/services/notifications/outbox"
import type { OutboundPayload } from "@/services/notifications/templates"

type DeliveryWriter = Parameters<typeof enqueueNotificationDeliveries>[0]

export type NotifiableOrder = {
  id: string
  orderNumber: string
  userId: string | null
  customerName: string
  email: string
  phone: string
  totalPesewas: number
  currency: string
}

export function resolveAppUrl() {
  const configured =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "")
  try {
    return new URL(configured || "http://localhost:3000").origin
  } catch {
    return "http://localhost:3000"
  }
}

export function orderNotificationPayload(
  order: NotifiableOrder,
  extra: Partial<OutboundPayload> = {}
): OutboundPayload {
  const appUrl = resolveAppUrl()
  return {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    amountPesewas: order.totalPesewas,
    currency: order.currency,
    guest: !order.userId,
    orderUrl: order.userId
      ? `${appUrl}/account/orders/${encodeURIComponent(order.orderNumber)}`
      : `${appUrl}/orders/${encodeURIComponent(order.orderNumber)}`,
    ...extra,
  }
}

export async function enqueueOrderNotification(
  writer: DeliveryWriter,
  input: {
    eventKey: string
    template: NotificationTemplate
    order: NotifiableOrder
    extra?: Partial<OutboundPayload>
  }
) {
  return enqueueNotificationDeliveries(writer, {
    eventKey: input.eventKey,
    template: input.template,
    email: input.order.email,
    phone: input.order.phone,
    payload: orderNotificationPayload(input.order, input.extra),
  })
}

export async function enqueuePasswordResetSuccess(user: {
  id: string
  name: string
  email: string
  phoneNumber?: string | null
  phoneNumberVerified?: boolean
}) {
  const eventKey = `auth:${user.id}:password-reset:${randomUUID()}`
  await enqueueNotificationDeliveries(prisma, {
    eventKey,
    template: "PASSWORD_RESET_SUCCESS",
    email: user.email,
    phone: user.phoneNumberVerified ? user.phoneNumber : null,
    payload: {
      customerName: user.name,
      appUrl: resolveAppUrl(),
    },
  })
  scheduleNotificationDelivery([eventKey])
}
