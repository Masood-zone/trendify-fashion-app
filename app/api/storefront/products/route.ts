import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  publicProductInclude,
  publicProductWhere,
  serializeProductCard,
} from "@/services/storefront/catalog"

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    const page = Math.max(1, Number(params.get("page")) || 1)
    const pageSize = Math.min(60, Math.max(1, Number(params.get("pageSize")) || 24))
    const search = params.get("q")?.trim()
    const category = params.get("category")
    const collection = params.get("collection")
    const brand = params.get("brand")
    const audience = params.get("audience")
    const size = params.get("size")
    const color = params.get("color")
    const minPrice = Number(params.get("minPrice")) || undefined
    const maxPrice = Number(params.get("maxPrice")) || undefined
    const where = {
      ...publicProductWhere,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { tags: { some: { tag: { name: { contains: search, mode: "insensitive" as const } } } } },
            ],
          }
        : {}),
      ...(category ? { categories: { some: { category: { slug: category, active: true, deletedAt: null } } } } : {}),
      ...(collection ? { collections: { some: { collection: { slug: collection, status: "PUBLISHED" as const, deletedAt: null } } } } : {}),
      ...(brand ? { brand: { slug: brand, active: true, deletedAt: null } } : {}),
      ...(audience && ["MEN", "WOMEN", "UNISEX"].includes(audience)
        ? { audience: audience as "MEN" | "WOMEN" | "UNISEX" }
        : {}),
      ...(size ? { variants: { some: { sizeLabel: size, active: true, deletedAt: null } } } : {}),
      ...(color ? { variants: { some: { colorName: { equals: color, mode: "insensitive" as const }, active: true, deletedAt: null } } } : {}),
      ...(params.get("madeInGhana") === "true" ? { madeInGhana: true } : {}),
      ...(params.get("newArrival") === "true" ? { newArrival: true } : {}),
      ...(params.get("available") === "true"
        ? { variants: { some: { active: true, deletedAt: null, stockQuantity: { gt: 0 } } } }
        : {}),
      ...(minPrice || maxPrice ? { basePricePesewas: { gte: minPrice, lte: maxPrice } } : {}),
    }
    const orderBy =
      params.get("sort") === "price-asc"
        ? { basePricePesewas: "asc" as const }
        : params.get("sort") === "price-desc"
          ? { basePricePesewas: "desc" as const }
          : params.get("sort") === "name-asc"
            ? { name: "asc" as const }
            : { publishedAt: "desc" as const }
    const [items, total, brands, variants] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: publicProductInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
      prisma.brand.findMany({
        where: { active: true, deletedAt: null, products: { some: publicProductWhere } },
        select: { id: true, name: true, slug: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.productVariant.findMany({
        where: { active: true, deletedAt: null, product: publicProductWhere },
        select: { sizeLabel: true, colorName: true, colorHex: true },
        distinct: ["sizeLabel", "colorName", "colorHex"],
      }),
    ])
    return ok({
      items: items.map(serializeProductCard),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      facets: {
        brands,
        sizes: [...new Set(variants.map((item) => item.sizeLabel).filter((value): value is string => Boolean(value)))],
        colors: Array.from(
          new Map(
            variants
              .filter((item): item is typeof item & { colorName: string } => Boolean(item.colorName))
              .map((item) => [item.colorName.toLowerCase(), { name: item.colorName, hex: item.colorHex }])
          ).values()
        ),
      },
    })
  } catch (error) {
    return serverError(error)
  }
}
