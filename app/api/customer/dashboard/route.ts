import { requireCustomer } from "@/lib/customer-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { serializeOrderSummary } from "@/services/orders/serialize-order"
export async function GET(request: Request) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const userId = guard.session.user.id
    const [recentOrders, orderCount, wishlistCount, defaultAddress] =
      await prisma.$transaction([
        prisma.order.findMany({
          where: { userId },
          include: {
            items: { take: 3 },
            payments: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.order.count({ where: { userId } }),
        prisma.wishlistItem.count({ where: { userId } }),
        prisma.address.findFirst({
          where: { userId, isDefault: true, deletedAt: null },
        }),
      ])
    return ok({
      recentOrders: recentOrders.map(serializeOrderSummary),
      orderCount,
      wishlistCount,
      defaultAddress,
    })
  } catch (error) {
    return serverError(error)
  }
}
