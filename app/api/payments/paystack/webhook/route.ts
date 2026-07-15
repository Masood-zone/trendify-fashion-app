import { createHmac, timingSafeEqual } from "node:crypto"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  recordFailedPayment,
  recordSuccessfulPayment,
} from "@/services/payments/payment-workflow"

type PaystackEvent = {
  event: string
  data?: {
    id?: number | string
    reference?: string
    status?: string
    amount?: number
    currency?: string
    paid_at?: string
    gateway_response?: string
  }
}

export async function POST(request: Request) {
  const raw = await request.text()
  try {
    const secret = process.env.PAYSTACK_API_SECRET_KEY
    const signature = request.headers.get("x-paystack-signature")
    if (!secret || !signature)
      return new Response("Unauthorized", { status: 401 })
    const expected = createHmac("sha512", secret).update(raw).digest("hex")
    const left = Buffer.from(signature)
    const right = Buffer.from(expected)
    if (left.length !== right.length || !timingSafeEqual(left, right))
      return new Response("Unauthorized", { status: 401 })
    const payload = JSON.parse(raw) as PaystackEvent
    const reference = payload.data?.reference
    const providerEventId = `${payload.event}:${payload.data?.id ?? reference ?? createHmac("sha256", secret).update(raw).digest("hex")}`
    const existing = await prisma.paymentWebhookEvent.findUnique({
      where: { providerEventId },
    })
    if (existing) return ok({ received: true, duplicate: true })
    const payment = reference
      ? await prisma.payment.findUnique({ where: { reference } })
      : null
    const event = await prisma.paymentWebhookEvent.create({
      data: {
        providerEventId,
        eventType: payload.event,
        reference,
        paymentId: payment?.id,
        payload: payload as never,
      },
    })
    if (!payment || !reference) {
      await prisma.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { status: "IGNORED", processedAt: new Date() },
      })
      return ok({ received: true })
    }
    if (
      payload.event === "charge.success" &&
      payload.data?.status === "success"
    )
      await recordSuccessfulPayment(
        event.id,
        reference,
        payload.data.amount ?? -1,
        payload.data.currency ?? "",
        String(payload.data.id ?? ""),
        payload.data.paid_at ? new Date(payload.data.paid_at) : undefined
      )
    else if (payload.event === "charge.failed")
      await recordFailedPayment(
        event.id,
        reference,
        payload.data?.gateway_response
      )
    else
      await prisma.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { status: "IGNORED", processedAt: new Date() },
      })
    return ok({ received: true })
  } catch (error) {
    return serverError(error)
  }
}
