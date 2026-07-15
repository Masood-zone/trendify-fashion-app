import { randomBytes } from "node:crypto"
import { z } from "zod"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { hashShopperToken, resolveShopper } from "@/lib/shopper-context"
import { initializePaystackTransaction } from "@/lib/paystack/paystack"
const schema = z.object({
  orderId: z.cuid(),
  channel: z
    .enum(["MOBILE_MONEY", "CARD", "BANK_TRANSFER"])
    .default("MOBILE_MONEY"),
  mobileMoneyNetwork: z
    .enum(["MTN", "TELECEL", "AIRTELTIGO", "OTHER"])
    .optional(),
  payerPhone: z.string().min(9).max(20).optional(),
  payerName: z.string().max(120).optional(),
  guestAccessToken: z.string().optional(),
})
const maskPhone = (phone?: string) =>
  phone ? `${phone.slice(0, 3)}****${phone.slice(-3)}` : undefined
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const shopper = await resolveShopper(request)
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
    })
    if (!order) return fail("Order not found", 404)
    const guestHash = parsed.data.guestAccessToken
      ? hashShopperToken(parsed.data.guestAccessToken)
      : undefined
    if (
      order.userId
        ? order.userId !== shopper.userId
        : order.guestAccessTokenHash !== guestHash
    )
      return fail("Order access denied", 403)
    if (order.status !== "PENDING_PAYMENT")
      return fail("Order is not awaiting payment", 409)
    const reference = `TRD_PAY_${Date.now()}_${randomBytes(4).toString("hex")}`
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        reference,
        amountPesewas: order.totalPesewas,
        channel: parsed.data.channel,
        mobileMoneyNetwork: parsed.data.mobileMoneyNetwork,
        payerPhoneMasked: maskPhone(parsed.data.payerPhone),
        payerName: parsed.data.payerName,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    })
    try {
      const gateway = await initializePaystackTransaction({
        amount: order.totalPesewas,
        currency: "GHS",
        email: order.email,
        reference,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentId: payment.id,
        },
      })
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PENDING" },
      })
      return ok({
        reference,
        authorizationUrl: gateway.authorization_url,
        accessCode: gateway.access_code,
        publicKey: process.env.PAYSTACK_API_PUBLIC_KEY,
      })
    } catch (error) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureMessage:
            error instanceof Error ? error.message : "Initialization failed",
        },
      })
      throw error
    }
  } catch (error) {
    return serverError(error)
  }
}
