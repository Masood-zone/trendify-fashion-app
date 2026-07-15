import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  publicProductInclude,
  publicProductWhere,
} from "@/services/storefront/catalog"

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    const page = Math.max(1, Number(params.get("page")) || 1)
    const pageSize = Math.min(
      60,
      Math.max(1, Number(params.get("pageSize")) || 24)
    )
    const search = params.get("q")?.trim()
    const category = params.get("category")
    const collection = params.get("collection")
    const minPrice = Number(params.get("minPrice")) || undefined
    const maxPrice = Number(params.get("maxPrice")) || undefined
    const where = {
      ...publicProductWhere,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              {
                description: { contains: search, mode: "insensitive" as const },
              },
              {
                tags: {
                  some: {
                    tag: {
                      name: { contains: search, mode: "insensitive" as const },
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(category
        ? {
            categories: {
              some: {
                category: { slug: category, active: true, deletedAt: null },
              },
            },
          }
        : {}),
      ...(collection
        ? {
            collections: {
              some: {
                collection: {
                  slug: collection,
                  status: "PUBLISHED" as const,
                  deletedAt: null,
                },
              },
            },
          }
        : {}),
      ...(minPrice || maxPrice
        ? { basePricePesewas: { gte: minPrice, lte: maxPrice } }
        : {}),
    }
    const orderBy =
      params.get("sort") === "price-asc"
        ? { basePricePesewas: "asc" as const }
        : params.get("sort") === "price-desc"
          ? { basePricePesewas: "desc" as const }
          : { publishedAt: "desc" as const }
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: publicProductInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ])
    return ok({
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    })
  } catch (error) {
    return serverError(error)
  }
}
