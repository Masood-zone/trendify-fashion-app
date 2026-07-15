import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  publicProductWhere,
  publishedContentWhere,
} from "@/services/storefront/catalog"
export async function GET() {
  try {
    const [sections, settings] = await prisma.$transaction([
      prisma.homepageSection.findMany({
        where: { ...publishedContentWhere, enabled: true },
        include: {
          mediaAsset: true,
          items: { orderBy: { sortOrder: "asc" } },
          products: {
            where: { product: publicProductWhere },
            include: {
              product: {
                include: {
                  media: {
                    include: { mediaAsset: true },
                    orderBy: { sortOrder: "asc" },
                    take: 1,
                  },
                  variants: { where: { active: true, deletedAt: null } },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
          categories: {
            include: { category: true },
            orderBy: { sortOrder: "asc" },
          },
          collections: {
            include: { collection: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.storeSettings.findUnique({ where: { key: "default" } }),
    ])
    return ok({ sections, settings })
  } catch (error) {
    return serverError(error)
  }
}
