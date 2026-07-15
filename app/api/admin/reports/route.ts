import { requireAdmin } from "@/lib/admin-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

function bounds(request: Request) {
  const params = new URL(request.url).searchParams
  const end = params.get("to")
    ? new Date(`${params.get("to")}T23:59:59.999Z`)
    : new Date()
  const start = params.get("from")
    ? new Date(`${params.get("from")}T00:00:00.000Z`)
    : new Date(end.getTime() - 30 * 86400000)
  return { start, end }
}

export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const { start, end } = bounds(request)
    const [
      payments,
      orders,
      newCustomers,
      inventory,
      promotions,
      statusGroups,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: {
                    include: {
                      categories: {
                        where: { primary: true },
                        include: { category: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, userId: true, totalPesewas: true, status: true },
      }),
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: start, lte: end },
          deletedAt: null,
        },
      }),
      prisma.productVariant.findMany({
        where: { deletedAt: null },
        select: {
          stockQuantity: true,
          reservedQuantity: true,
          lowStockThreshold: true,
          pricePesewas: true,
        },
      }),
      prisma.promotionRedemption.findMany({
        where: { redeemedAt: { gte: start, lte: end } },
        include: { promotion: { select: { code: true } } },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: start, lte: end } },
        _count: { status: true },
        orderBy: { status: "asc" },
      }),
    ])
    const successful = payments.filter(
      (payment) => payment.status === "SUCCESS"
    )
    const productSales = new Map<string, number>()
    const categorySales = new Map<string, number>()
    for (const payment of successful)
      for (const item of payment.order.items) {
        productSales.set(
          item.productNameSnapshot,
          (productSales.get(item.productNameSnapshot) ?? 0) +
            item.lineTotalPesewas
        )
        const category =
          item.product?.categories[0]?.category.name ?? "Uncategorized"
        categorySales.set(
          category,
          (categorySales.get(category) ?? 0) + item.lineTotalPesewas
        )
      }
    const revenuePesewas = successful.reduce(
      (sum, item) => sum + item.amountPesewas,
      0
    )
    return ok({
      range: { start, end },
      revenuePesewas,
      orderCount: orders.length,
      averageOrderValuePesewas: successful.length
        ? Math.round(revenuePesewas / successful.length)
        : 0,
      newCustomers,
      repeatCustomers: Math.max(
        0,
        new Set(
          orders.filter((order) => order.userId).map((order) => order.userId)
        ).size - newCustomers
      ),
      payments: {
        successful: successful.length,
        pending: payments.filter((item) =>
          ["INITIALIZED", "PENDING"].includes(item.status)
        ).length,
        failed: payments.filter((item) =>
          ["FAILED", "CANCELLED"].includes(item.status)
        ).length,
      },
      inventory: {
        valuePesewas: inventory.reduce(
          (sum, item) => sum + item.stockQuantity * item.pricePesewas,
          0
        ),
        lowStock: inventory.filter(
          (item) =>
            item.stockQuantity - item.reservedQuantity <=
              item.lowStockThreshold &&
            item.stockQuantity - item.reservedQuantity > 0
        ).length,
        outOfStock: inventory.filter(
          (item) => item.stockQuantity - item.reservedQuantity <= 0
        ).length,
      },
      ordersByStatus: statusGroups.map((group) => ({
        status: group.status,
        count: (group._count as { status?: number } | undefined)?.status ?? 0,
      })),
      salesByProduct: Array.from(productSales, ([name, valuePesewas]) => ({
        name,
        valuePesewas,
      })).sort((a, b) => b.valuePesewas - a.valuePesewas),
      salesByCategory: Array.from(categorySales, ([name, valuePesewas]) => ({
        name,
        valuePesewas,
      })).sort((a, b) => b.valuePesewas - a.valuePesewas),
      discounts: {
        redemptionCount: promotions.length,
        valuePesewas: promotions.reduce(
          (sum, item) => sum + item.discountPesewas,
          0
        ),
      },
    })
  } catch (error) {
    return serverError(error)
  }
}
