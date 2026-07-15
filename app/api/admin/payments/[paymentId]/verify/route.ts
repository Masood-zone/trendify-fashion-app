import { requireAdmin } from "@/lib/admin-api"
import { fail, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { reconcilePaystackPayment } from "@/services/payments/payment-workflow"

export async function POST(
  request: Request,
  context: { params: Promise<{ paymentId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).paymentId
    const payment = await prisma.payment.findUnique({
      where: { id },
      select: { reference: true },
    })
    if (!payment) return fail("Payment attempt not found", 404)
    const result = await reconcilePaystackPayment(payment.reference)
    await auditAdmin(guard.session.user.id, "payment.verify", "Payment", id, {
      reference: payment.reference,
      status: result.payment.status,
    })
    return ok(result)
  } catch (error) {
    return serverError(error)
  }
}
