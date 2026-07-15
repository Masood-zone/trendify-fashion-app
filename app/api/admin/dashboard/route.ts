import { requireAdmin } from "@/lib/admin-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const now = new Date()
    const currentStart = new Date(now.getTime() - 30 * 86400000)
    const previousStart = new Date(now.getTime() - 60 * 86400000)
    const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const [
      totalRevenue,
      successfulPayments,
      previousRevenue,
      currentOrders,
      previousOrders,
      totalOrders,
      currentCustomers,
      previousCustomers,
      totalCustomers,
      pendingOrders,
      products,
      statusGroups,
      recentOrders,
      paidItems,
    ] = await prisma.$transaction([
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amountPesewas: true },
      }),
      prisma.payment.findMany({
        where: { status: "SUCCESS", paidAt: { gte: yearStart } },
        select: { amountPesewas: true, paidAt: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          paidAt: { gte: previousStart, lt: currentStart },
        },
        _sum: { amountPesewas: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: currentStart } } }),
      prisma.order.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } },
      }),
      prisma.order.count(),
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: currentStart },
          deletedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: previousStart, lt: currentStart },
          deletedAt: null,
        },
      }),
      prisma.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
      prisma.order.count({
        where: {
          status: { in: ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING"] },
        },
      }),
      prisma.product.findMany({
        where: { deletedAt: null },
        include: {
          variants: { where: { active: true, deletedAt: null } },
          media: {
            where: { primary: true },
            include: { mediaAsset: true },
            take: 1,
          },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
        orderBy: { status: "asc" },
      }),
      prisma.order.findMany({
        include: { payments: { where: { status: "SUCCESS" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.orderItem.findMany({
        where: { order: { payments: { some: { status: "SUCCESS" } } } },
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
      }),
    ])

    const revenuePesewas = totalRevenue._sum.amountPesewas ?? 0
    const currentRevenue = successfulPayments
      .filter((payment) => payment.paidAt && payment.paidAt >= currentStart)
      .reduce((sum, payment) => sum + payment.amountPesewas, 0)
    const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1)
      const next = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      return {
        label: date.toLocaleString("en-GH", { month: "short" }),
        valuePesewas: successfulPayments
          .filter(
            (payment) =>
              payment.paidAt && payment.paidAt >= date && payment.paidAt < next
          )
          .reduce((sum, payment) => sum + payment.amountPesewas, 0),
      }
    })

    const productsInStock = products.filter((product) =>
      product.variants.some(
        (variant) => variant.stockQuantity - variant.reservedQuantity > 0
      )
    ).length
    const lowStockProducts = products
      .map((product) => {
        const available = product.variants.reduce(
          (sum, variant) =>
            sum + Math.max(0, variant.stockQuantity - variant.reservedQuantity),
          0
        )
        const threshold = product.variants.reduce(
          (sum, variant) => sum + variant.lowStockThreshold,
          0
        )
        return {
          id: product.id,
          name: product.name,
          available,
          threshold,
          imageUrl: product.media[0]?.mediaAsset.secureUrl ?? null,
        }
      })
      .filter((product) => product.available <= product.threshold)
      .sort((a, b) => a.available - b.available)

    const status = Object.fromEntries(
      statusGroups.map((group) => {
        const counts = group._count as { status?: number } | undefined
        return [group.status, counts?.status ?? 0]
      })
    )
    const orderStatus = {
      delivered: status.DELIVERED ?? 0,
      processing:
        (status.CONFIRMED ?? 0) +
        (status.PROCESSING ?? 0) +
        (status.SHIPPED ?? 0) +
        (status.OUT_FOR_DELIVERY ?? 0),
      refunded: status.REFUNDED ?? 0,
      pending: status.PENDING_PAYMENT ?? 0,
      cancelled: status.CANCELLED ?? 0,
    }
    const salesMap = new Map<string, number>()
    for (const item of paidItems) {
      const category =
        item.product?.categories[0]?.category.name ?? "Uncategorized"
      salesMap.set(
        category,
        (salesMap.get(category) ?? 0) + item.lineTotalPesewas
      )
    }

    return ok({
      summary: {
        revenuePesewas,
        totalOrders,
        totalCustomers,
        productsInStock,
        pendingOrders,
        lowStockProducts: lowStockProducts.length,
      },
      changes: {
        revenue: percentChange(
          currentRevenue,
          previousRevenue._sum.amountPesewas ?? 0
        ),
        orders: percentChange(currentOrders, previousOrders),
        customers: percentChange(currentCustomers, previousCustomers),
      },
      monthlyRevenue,
      orderStatus,
      salesByCategory: Array.from(salesMap, ([name, valuePesewas]) => ({
        name,
        valuePesewas,
      }))
        .sort((a, b) => b.valuePesewas - a.valuePesewas)
        .slice(0, 5),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        createdAt: order.createdAt,
        totalPesewas: order.totalPesewas,
        status: order.status,
        paid: order.payments.length > 0,
      })),
      lowStock: lowStockProducts.slice(0, 5),
    })
  } catch (error) {
    return serverError(error)
  }
}
