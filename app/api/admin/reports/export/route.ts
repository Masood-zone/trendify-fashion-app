import { requireAdmin } from "@/lib/admin-api"
import { csvResponse } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  const params = new URL(request.url).searchParams
  const from = params.get("from")
    ? new Date(`${params.get("from")}T00:00:00.000Z`)
    : new Date(Date.now() - 30 * 86400000)
  const to = params.get("to")
    ? new Date(`${params.get("to")}T23:59:59.999Z`)
    : new Date()
  const payments = await prisma.payment.findMany({
    where: { status: "SUCCESS", paidAt: { gte: from, lte: to } },
    include: { order: true },
    orderBy: { paidAt: "desc" },
  })
  return csvResponse(
    payments.map((item) => ({
      Date: item.paidAt?.toISOString(),
      Reference: item.reference,
      Order: item.order.orderNumber,
      Customer: item.order.customerName,
      Email: item.order.email,
      AmountGHS: (item.amountPesewas / 100).toFixed(2),
      Channel: item.channel,
      ProviderStatus: item.providerStatus,
    })),
    "trendify-verified-sales.csv"
  )
}
