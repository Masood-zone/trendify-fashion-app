import { requireAdmin } from "@/lib/admin-api"
import { fail, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const order = await prisma.order.findUnique({
      where: { id: (await context.params).orderId },
      include: {
        user: true,
        items: true,
        payments: { orderBy: { createdAt: "desc" } },
        events: { orderBy: { occurredAt: "asc" } },
        deliveryMethod: true,
        promotion: true,
      },
    })
    return order ? ok(order) : fail("Order not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
