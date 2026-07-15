import { z } from "zod"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { verifyPaystackTransaction } from "@/lib/paystack/paystack"
const schema = z.object({ reference: z.string().min(1) })
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const payment = await prisma.payment.findUnique({
      where: { reference: parsed.data.reference },
      include: { order: { select: { orderNumber: true, status: true } } },
    })
    if (!payment) return fail("Payment not found", 404)
    const provider = await verifyPaystackTransaction(
      parsed.data.reference
    ).catch(() => null)
    return ok({
      reference: payment.reference,
      paymentStatus: payment.status,
      orderStatus: payment.order.status,
      orderNumber: payment.order.orderNumber,
      providerStatus: provider?.status ?? null,
      confirmed: payment.status === "SUCCESS",
    })
  } catch (error) {
    return serverError(error)
  }
}
