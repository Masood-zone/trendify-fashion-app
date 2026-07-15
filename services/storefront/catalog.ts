import { ProductStatus, PublicationStatus } from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

export const publicProductInclude = {
  brand: true,
  artisan: true,
  variants: {
    where: { active: true, deletedAt: null },
    orderBy: { pricePesewas: "asc" as const },
  },
  media: {
    include: { mediaAsset: true },
    orderBy: { sortOrder: "asc" as const },
  },
  categories: {
    include: { category: true },
    orderBy: { sortOrder: "asc" as const },
  },
  collections: {
    include: { collection: true },
    orderBy: { sortOrder: "asc" as const },
  },
  tags: { include: { tag: true } },
} as const

export const publicProductWhere = {
  status: ProductStatus.ACTIVE,
  deletedAt: null,
  publishedAt: { lte: new Date() },
} as const

export async function getPublicProduct(slug: string) {
  return prisma.product.findFirst({
    where: { ...publicProductWhere, slug },
    include: {
      ...publicProductInclude,
      sizeGuide: true,
      reviews: {
        where: { status: "APPROVED", deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      recommendations: {
        orderBy: { sortOrder: "asc" },
        include: { recommendedProduct: { include: publicProductInclude } },
      },
    },
  })
}

export const publishedContentWhere = {
  status: PublicationStatus.PUBLISHED,
  deletedAt: null,
  publishedAt: { lte: new Date() },
} as const
