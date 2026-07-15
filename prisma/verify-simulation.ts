import "dotenv/config"

import { createHash } from "node:crypto"

import { prisma } from "../lib/prisma"
import { CANONICAL_HOMEPAGE_SLOTS } from "../services/storefront/homepage"
import {
  SIMULATION_PREFIX,
  artisans,
  brands,
  categories,
  collections,
  products,
  sizeGuides,
  slugify,
  tags,
} from "./simulation-data"
import { preflightImageUrls } from "./simulation-images"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Simulation verification failed: ${message}`)
}

async function main() {
  const productSlugs = products.map((product) => slugify(product.name))
  const catalogue = await prisma.product.findMany({
    where: { slug: { in: productSlugs } },
    include: {
      brand: true,
      artisan: true,
      sizeGuide: true,
      variants: { where: { deletedAt: null } },
      media: { include: { mediaAsset: true } },
      categories: true,
      collections: true,
      tags: true,
      recommendations: true,
    },
    orderBy: { slug: "asc" },
  })
  assert(catalogue.length === 24, `expected 24 products, found ${catalogue.length}`)
  for (const brand of brands) {
    const count = catalogue.filter((product) => product.brand?.slug === brand.slug).length
    assert(count === 8, `expected 8 products for ${brand.name}, found ${count}`)
  }

  const variants = catalogue.flatMap((product) => product.variants)
  assert(variants.length === 75, `expected 75 variants, found ${variants.length}`)
  assert(new Set(variants.map((variant) => variant.sku)).size === 75, "simulation SKUs are not unique")
  const media = catalogue.flatMap((product) => product.media)
  assert(media.length === 48, `expected 48 product-media rows, found ${media.length}`)
  const recommendations = catalogue.flatMap((product) => product.recommendations)
  assert(recommendations.length === 72, `expected 72 recommendations, found ${recommendations.length}`)

  for (const product of catalogue) {
    assert(product.status === "ACTIVE" && !product.deletedAt, `${product.name} is not active`)
    assert(Boolean(product.brand && product.artisan && product.sizeGuide), `${product.name} lacks brand, artisan, or size guide`)
    assert(Boolean(product.description && product.shortDescription && product.materialSummary && product.careInstructions), `${product.name} has incomplete catalogue copy`)
    assert(Boolean(product.seoTitle && product.seoDescription && product.audience && product.publishedAt), `${product.name} has incomplete SEO/publication fields`)
    assert(product.basePricePesewas > 0 && (product.costPricePesewas ?? 0) > 0, `${product.name} has invalid pricing`)
    assert(product.madeInGhana, `${product.name} is not marked Made in Ghana`)
    assert(product.categories.length > 0 && product.collections.length > 0 && product.tags.length > 0, `${product.name} lacks catalogue relations`)
    assert(product.variants.some((variant) => variant.active && variant.stockQuantity - variant.reservedQuantity > 0), `${product.name} has no purchasable variant`)
    assert(product.media.length === 2, `${product.name} does not have exactly two images`)
    assert(product.media.filter((item) => item.primary).length === 1, `${product.name} does not have exactly one primary image`)
    assert(product.recommendations.length === 3, `${product.name} does not have exactly three recommendations`)
  }

  const imageAssets = await prisma.mediaAsset.findMany({
    where: { publicId: { startsWith: SIMULATION_PREFIX } },
    orderBy: { publicId: "asc" },
  })
  assert(imageAssets.length === 53, `expected 53 simulation media assets, found ${imageAssets.length}`)
  assert(imageAssets.every((asset) => asset.secureUrl.startsWith("https://lh3.googleusercontent.com/aida-public/") && asset.mimeType?.startsWith("image/")), "a simulation media asset is not a public aida image")
  console.log(`Checking reachability for ${imageAssets.length} simulation images...`)
  await preflightImageUrls(imageAssets.map((asset) => asset.secureUrl))

  const [brandRows, artisanRows, categoryRows, collectionRows, tagRows, guideRows] = await Promise.all([
    prisma.brand.findMany({ where: { slug: { in: brands.map((item) => item.slug) } }, select: { id: true, slug: true } }),
    prisma.artisan.findMany({ where: { slug: { in: artisans.map((item) => item.slug) } }, select: { id: true, slug: true } }),
    prisma.category.findMany({ where: { slug: { in: categories.map((item) => item.slug) } }, select: { id: true, slug: true } }),
    prisma.collection.findMany({ where: { slug: { in: collections.map((item) => item.slug) } }, select: { id: true, slug: true, status: true } }),
    prisma.tag.findMany({ where: { slug: { in: tags.map(([, slug]) => slug) } }, select: { id: true, slug: true } }),
    prisma.sizeGuide.findMany({ where: { name: { in: sizeGuides.map((item) => item.name) } }, select: { id: true, name: true } }),
  ])
  assert(brandRows.length === 3, `expected 3 simulation brands, found ${brandRows.length}`)
  assert(artisanRows.length === 4, `expected 4 simulation artisans, found ${artisanRows.length}`)
  assert(categoryRows.length === 9, `expected 9 new simulation categories, found ${categoryRows.length}`)
  assert(collectionRows.length === 5 && collectionRows.every((row) => row.status === "PUBLISHED"), "expected 5 published simulation collections")
  assert(tagRows.length === 10, `expected 10 simulation tags, found ${tagRows.length}`)
  assert(guideRows.length === 4, `expected 4 simulation size guides, found ${guideRows.length}`)
  assert(Boolean(await prisma.category.findUnique({ where: { slug: "footwear" } })), "existing Footwear category is missing")

  const promotions = await prisma.promotion.findMany({ where: { code: { in: ["AKWAABA15", "GHSTYLE100", "FREESHIPACCRA", "HERITAGE10"] } }, orderBy: { code: "asc" } })
  assert(promotions.length === 4, `expected 4 promotions, found ${promotions.length}`)
  assert(promotions.find((item) => item.code === "AKWAABA15")?.active, "AKWAABA15 is not active")
  assert(promotions.find((item) => item.code === "GHSTYLE100")?.active, "GHSTYLE100 is not active")
  assert(!promotions.find((item) => item.code === "FREESHIPACCRA")?.active, "FREESHIPACCRA should be inactive")
  assert(!promotions.find((item) => item.code === "HERITAGE10")?.active, "HERITAGE10 should be inactive")

  const deliveries = await prisma.deliveryMethod.findMany({ where: { code: { in: ["ACCRA_SAME_DAY", "GH_STANDARD"] } }, orderBy: { code: "asc" } })
  assert(deliveries.length === 2 && deliveries.every((item) => item.active), "expected two active simulation delivery methods")
  assert(deliveries.find((item) => item.code === "ACCRA_SAME_DAY")?.regions.includes("Greater Accra"), "same-day delivery does not cover Greater Accra")
  assert(deliveries.find((item) => item.code === "GH_STANDARD")?.regions.length === 0, "nationwide delivery must use an empty region list")

  const pageSlugs = ["about-us", "shipping-delivery", "returns-exchanges", "support-help", "privacy-policy", "terms-of-service"]
  const pages = await prisma.contentPage.findMany({ where: { slug: { in: pageSlugs } }, select: { id: true, slug: true, status: true } })
  assert(pages.length === 6 && pages.every((page) => page.status === "PUBLISHED"), "expected six published simulation content pages")

  const settings = await prisma.storeSettings.findUnique({ where: { key: "default" } })
  const checkout = settings?.checkoutConfig as Record<string, unknown> | null
  assert(checkout?.country === "GH" && checkout.currency === "GHS" && checkout.taxRateBasisPoints === 1500, "default Ghana/GHS checkout settings are incomplete")

  const homepage = await prisma.homepageSection.findMany({
    where: { status: "PUBLISHED", enabled: true, deletedAt: null },
    include: { items: true, products: true, categories: true, collections: true },
    orderBy: { sortOrder: "asc" },
  })
  assert(homepage.length === 8, `expected exactly 8 published homepage slots, found ${homepage.length}`)
  for (const [index, slot] of CANONICAL_HOMEPAGE_SLOTS.entries()) {
    assert(homepage[index]?.key === slot.key && homepage[index]?.type === slot.type && homepage[index]?.sortOrder === slot.sortOrder, `homepage slot ${index + 1} is not ${slot.key}`)
  }
  assert(homepage.find((section) => section.key === "benefits")?.items.length === 4, "benefits slot must contain four benefits")
  assert(homepage.find((section) => section.key === "category-grid")?.categories.length === 5, "category grid must contain five categories")
  assert(homepage.find((section) => section.key === "product-carousel")?.products.length === 8, "product carousel must contain eight products")
  assert(homepage.find((section) => section.key === "regional-trends")?.items.length === 4, "regional trends must contain four regions")

  const simProductIds = catalogue.map((product) => product.id)
  const [orderItems, reviews, movements] = await Promise.all([
    prisma.orderItem.count({ where: { productId: { in: simProductIds } } }),
    prisma.review.count({ where: { productId: { in: simProductIds } } }),
    prisma.inventoryMovement.count({ where: { variant: { productId: { in: simProductIds } } } }),
  ])
  assert(orderItems === 0 && reviews === 0 && movements === 0, "simulation unexpectedly created order, review, or inventory history")

  const stableIds = [
    ...brandRows.map(({ id, slug }) => `brand:${slug}:${id}`),
    ...artisanRows.map(({ id, slug }) => `artisan:${slug}:${id}`),
    ...categoryRows.map(({ id, slug }) => `category:${slug}:${id}`),
    ...collectionRows.map(({ id, slug }) => `collection:${slug}:${id}`),
    ...tagRows.map(({ id, slug }) => `tag:${slug}:${id}`),
    ...guideRows.map(({ id, name }) => `guide:${name}:${id}`),
    ...catalogue.map(({ id, slug }) => `product:${slug}:${id}`),
    ...variants.map(({ id, sku }) => `variant:${sku}:${id}`),
    ...media.map(({ id, productId, mediaAssetId }) => `product-media:${productId}:${mediaAssetId}:${id}`),
    ...imageAssets.map(({ id, publicId }) => `media:${publicId}:${id}`),
    ...promotions.map(({ id, code }) => `promotion:${code}:${id}`),
    ...deliveries.map(({ id, code }) => `delivery:${code}:${id}`),
    ...pages.map(({ id, slug }) => `page:${slug}:${id}`),
    ...homepage.map(({ id, key }) => `homepage:${key}:${id}`),
  ].sort()
  const stableIdHash = createHash("sha256").update(stableIds.join("\n")).digest("hex")
  console.log("Simulation verification passed: 24 products, 75 variants, 48 product images, 72 recommendations, and 8 canonical homepage slots.")
  console.log(`Stable ID fingerprint: ${stableIdHash}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
