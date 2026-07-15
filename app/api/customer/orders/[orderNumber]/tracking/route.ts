import { fail, ok, serverError } from "@/lib/api-response"
import { requireCustomer } from "@/lib/customer-api"
import { prisma } from "@/lib/prisma"
export async function GET(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: (await context.params).orderNumber,
        userId: guard.session.user.id,
      },
      select: {
        orderNumber: true,
        status: true,
        trackingNumber: true,
        carrier: true,
        estimatedDeliveryAt: true,
        deliveredAt: true,
        events: { orderBy: { occurredAt: "asc" } },
      },
    })
    return order ? ok(order) : fail("Order not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
