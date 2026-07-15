import { z } from "zod"

import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { hashShopperToken, resolveShopper } from "@/lib/shopper-context"
import { reconcilePaystackPayment } from "@/services/payments/payment-workflow"

const schema = z.object({
  reference: z.string().trim().min(1),
  guestAccessToken: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const shopper = await resolveShopper(request)
    const payment = await prisma.payment.findUnique({
      where: { reference: parsed.data.reference },
      include: { order: true },
    })
    if (!payment) return fail("Payment not found", 404)
    const guestHash = parsed.data.guestAccessToken
      ? hashShopperToken(parsed.data.guestAccessToken)
      : undefined
    const allowed = payment.order.userId
      ? payment.order.userId === shopper.userId
      : Boolean(
          guestHash && payment.order.guestAccessTokenHash === guestHash
        )
    if (!allowed) return fail("Payment access denied", 403)

    const result = await reconcilePaystackPayment(payment.reference)
    return ok({
      reference: result.payment.reference,
      paymentStatus: result.payment.status,
      providerStatus: result.providerStatus,
      orderStatus: result.order.status,
      orderNumber: result.order.orderNumber,
      confirmed: result.confirmed,
      lastCheckedAt: result.payment.lastCheckedAt,
    })
  } catch (error) {
    return serverError(error)
  }
}
