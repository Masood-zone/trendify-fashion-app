import { requireAdmin } from "@/lib/admin-api"
import { csvResponse } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  const params = new URL(request.url).searchParams
  const q = params.get("q")?.trim()
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      brand: true,
      categories: { where: { primary: true }, include: { category: true } },
      variants: { where: { deletedAt: null } },
    },
    orderBy: { createdAt: "desc" },
  })
  return csvResponse(
    products.map((item) => ({
      Name: item.name,
      Slug: item.slug,
      Status: item.status,
      Audience: item.audience,
      Brand: item.brand?.name,
      PrimaryCategory: item.categories[0]?.category.name,
      PriceGHS: (item.basePricePesewas / 100).toFixed(2),
      CostGHS:
        item.costPricePesewas == null
          ? ""
          : (item.costPricePesewas / 100).toFixed(2),
      SKUs: item.variants.map((variant) => variant.sku).join(" | "),
      AvailableStock: item.variants.reduce(
        (sum, variant) =>
          sum + Math.max(0, variant.stockQuantity - variant.reservedQuantity),
        0
      ),
      CreatedAt: item.createdAt.toISOString(),
    })),
    "trendify-products.csv"
  )
}
