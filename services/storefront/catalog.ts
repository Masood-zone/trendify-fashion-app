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
        include: {
          user: { select: { name: true, firstName: true } },
        },
      },
      recommendations: {
        where: { recommendedProduct: publicProductWhere },
        orderBy: { sortOrder: "asc" },
        include: { recommendedProduct: { include: publicProductInclude } },
      },
    },
  })
}

type PublicProductRecord = Awaited<ReturnType<typeof getPublicProduct>>
type PublicProductBase = NonNullable<PublicProductRecord>["recommendations"][number]["recommendedProduct"]

export function serializeProductCard(product: PublicProductBase) {
  const media = product.media.map((entry) => ({
    id: entry.mediaAsset.id,
    url: entry.mediaAsset.secureUrl,
    altText:
      entry.altText || entry.mediaAsset.altText || `${product.name} product image`,
    primary: entry.primary,
  }))
  const variants = product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    sizeLabel: variant.sizeLabel,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    pricePesewas: variant.pricePesewas,
    compareAtPricePesewas: variant.compareAtPricePesewas,
    availableQuantity: Math.max(
      0,
      variant.stockQuantity - variant.reservedQuantity
    ),
    active: variant.active,
  }))
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    basePricePesewas: product.basePricePesewas,
    compareAtPricePesewas: product.compareAtPricePesewas,
    audience: product.audience,
    featured: product.featured,
    newArrival: product.newArrival,
    madeInGhana: product.madeInGhana,
    brand: product.brand
      ? { id: product.brand.id, name: product.brand.name, slug: product.brand.slug }
      : null,
    artisan: product.artisan
      ? {
          id: product.artisan.id,
          name: product.artisan.name,
          slug: product.artisan.slug,
        }
      : null,
    media,
    variants,
    categories: product.categories.map(({ category }) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    collections: product.collections.map(({ collection }) => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
    })),
    available: variants.some((variant) => variant.availableQuantity > 0),
  }
}

export function serializeProductDetail(product: NonNullable<PublicProductRecord>) {
  const reviews = product.reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt.toISOString(),
    customerName: review.user.firstName || review.user.name,
  }))
  return {
    ...serializeProductCard(product),
    description: product.description,
    materialSummary: product.materialSummary,
    careInstructions: product.careInstructions,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    tags: product.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
    sizeGuide: product.sizeGuide
      ? {
          id: product.sizeGuide.id,
          name: product.sizeGuide.name,
          description: product.sizeGuide.description,
          measurementUnit: product.sizeGuide.measurementUnit,
          measurements: product.sizeGuide.measurements,
        }
      : null,
    reviews,
    ratingAverage: reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null,
    ratingCount: reviews.length,
    recommendations: product.recommendations.map(({ recommendedProduct }) =>
      serializeProductCard(recommendedProduct)
    ),
  }
}

export const publishedContentWhere = {
  status: PublicationStatus.PUBLISHED,
  deletedAt: null,
  publishedAt: { lte: new Date() },
} as const
