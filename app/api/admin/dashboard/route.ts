import { requireAdmin } from "@/lib/admin-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const [productCount, customerCount, pendingOrders, lowStock, revenue] =
      await prisma.$transaction([
        prisma.product.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
        prisma.order.count({
          where: {
            status: { in: ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING"] },
          },
        }),
        prisma.productVariant.count({
          where: { active: true, deletedAt: null, stockQuantity: { lte: 5 } },
        }),
        prisma.payment.aggregate({
          where: { status: "SUCCESS" },
          _sum: { amountPesewas: true },
        }),
      ])
    return ok({
      productCount,
      customerCount,
      pendingOrders,
      lowStock,
      revenuePesewas: revenue._sum.amountPesewas ?? 0,
    })
  } catch (error) {
    return serverError(error)
  }
}
