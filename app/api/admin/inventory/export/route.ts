import { requireAdmin } from "@/lib/admin-api"
import { csvResponse } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  const variants = await prisma.productVariant.findMany({
    where: { deletedAt: null },
    include: { product: true },
    orderBy: { sku: "asc" },
  })
  return csvResponse(
    variants.map((item) => ({
      SKU: item.sku,
      Product: item.product.name,
      Size: item.sizeLabel,
      Colour: item.colorName,
      PhysicalStock: item.stockQuantity,
      ReservedStock: item.reservedQuantity,
      AvailableStock: Math.max(0, item.stockQuantity - item.reservedQuantity),
      LowStockThreshold: item.lowStockThreshold,
      Active: item.active,
    })),
    "trendify-inventory.csv"
  )
}
