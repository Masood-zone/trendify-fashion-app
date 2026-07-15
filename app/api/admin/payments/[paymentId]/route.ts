import { requireAdmin } from "@/lib/admin-api"
import { fail, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ paymentId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: (await context.params).paymentId },
      include: {
        order: {
          include: { items: true, events: { orderBy: { occurredAt: "asc" } } },
        },
      },
    })
    return payment ? ok(payment) : fail("Payment attempt not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
