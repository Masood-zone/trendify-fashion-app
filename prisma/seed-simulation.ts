import "dotenv/config"

import { isDeepStrictEqual } from "node:util"

import { prisma } from "../lib/prisma"
import {
  SIMULATION_PREFIX,
  SIMULATION_PUBLISHED_AT,
  artisans,
  brands,
  categories,
  collections,
  products,
  sizeGuides,
  slugify,
  tags,
  variantsFor,
} from "./simulation-data"
import { loadCuratedImageUrls, preflightImageUrls } from "./simulation-images"

function assertSeedAllowed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Simulation seeding is disabled when NODE_ENV=production")
  }
  if (process.env.ALLOW_SIMULATION_SEED !== "true") {
    throw new Error("Set ALLOW_SIMULATION_SEED=true to run the development simulation seed")
  }
}

async function authSnapshot() {
  const [users, accounts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { id: "asc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    }),
    prisma.account.findMany({
      orderBy: { id: "asc" },
      select: { id: true, accountId: true, providerId: true, userId: true, createdAt: true, updatedAt: true },
    }),
  ])
  return { users, accounts }
}

async function seedFoundation(editorialUrls: string[]) {
  const brandRows = new Map<string, string>()
  for (const [index, brand] of brands.entries()) {
    const row = await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: { ...brand, active: true, sortOrder: 100 + index },
      update: { ...brand, active: true, sortOrder: 100 + index, deletedAt: null },
    })
    brandRows.set(brand.slug, row.id)
  }

  const artisanRows = new Map<string, string>()
  for (const [index, artisan] of artisans.entries()) {
    const description = `${artisan.name} leads ${artisan.craft} for this original simulation catalogue.`
    const row = await prisma.artisan.upsert({
      where: { slug: artisan.slug },
      create: { name: artisan.name, slug: artisan.slug, region: artisan.region, description, biography: `${description} The profile is fictional and created for development testing.`, active: true, featured: true, sortOrder: 100 + index },
      update: { name: artisan.name, region: artisan.region, description, biography: `${description} The profile is fictional and created for development testing.`, active: true, featured: true, sortOrder: 100 + index, deletedAt: null },
    })
    artisanRows.set(artisan.slug, row.id)
  }

  const categoryRows = new Map<string, string>()
  const footwear = await prisma.category.findUnique({ where: { slug: "footwear" } })
  if (!footwear) throw new Error("The existing Footwear category is required but was not found")
  categoryRows.set("footwear", footwear.id)
  for (const [index, category] of categories.entries()) {
    const parentId = category.parentSlug ? categoryRows.get(category.parentSlug) : null
    const imageUrl = ["clothing", "bags", "jewellery", "accessories"].includes(category.slug)
      ? editorialUrls[["clothing", "bags", "jewellery", "accessories"].indexOf(category.slug)]
      : undefined
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      create: { name: category.name, slug: category.slug, parentId, description: `Shop the simulated ${category.name.toLowerCase()} edit, made for testing Trendify Ghana.`, imageUrl, active: true, featured: !category.parentSlug, sortOrder: 100 + index },
      update: { name: category.name, parentId, description: `Shop the simulated ${category.name.toLowerCase()} edit, made for testing Trendify Ghana.`, imageUrl, active: true, featured: !category.parentSlug, sortOrder: 100 + index, deletedAt: null },
    })
    categoryRows.set(category.slug, row.id)
  }

  const collectionRows = new Map<string, string>()
  for (const [index, collection] of collections.entries()) {
    const row = await prisma.collection.upsert({
      where: { slug: collection.slug },
      create: { ...collection, description: `A cross-brand simulation edit celebrating ${collection.name.toLowerCase()}.`, imageUrl: editorialUrls[index], status: "PUBLISHED", featured: true, sortOrder: 100 + index, publishedAt: SIMULATION_PUBLISHED_AT },
      update: { ...collection, description: `A cross-brand simulation edit celebrating ${collection.name.toLowerCase()}.`, imageUrl: editorialUrls[index], status: "PUBLISHED", featured: true, sortOrder: 100 + index, publishedAt: SIMULATION_PUBLISHED_AT, deletedAt: null },
    })
    collectionRows.set(collection.slug, row.id)
  }

  const tagRows = new Map<string, string>()
  for (const [name, slug] of tags) {
    const row = await prisma.tag.upsert({ where: { slug }, create: { name, slug }, update: { name } })
    tagRows.set(slug, row.id)
  }

  const guideRows = new Map<string, string>()
  for (const guide of sizeGuides) {
    const existing = await prisma.sizeGuide.findFirst({ where: { name: guide.name } })
    const data = { name: guide.name, description: guide.description, measurementUnit: "cm", measurements: guide.measurements as never, deletedAt: null }
    const row = existing
      ? await prisma.sizeGuide.update({ where: { id: existing.id }, data })
      : await prisma.sizeGuide.create({ data })
    guideRows.set(guide.key, row.id)
  }
  return { brandRows, artisanRows, categoryRows, collectionRows, tagRows, guideRows }
}

function guideKeyFor(categorySlug: string) {
  if (["dresses", "shirts-and-tops", "bottoms", "outerwear", "one-pieces"].includes(categorySlug)) return "clothing"
  if (categorySlug === "footwear") return "footwear"
  if (categorySlug === "bags") return "bags"
  return "accessories"
}

async function seedMedia(urls: string[]) {
  const rows: string[] = []
  for (const [index, url] of urls.entries()) {
    const productIndex = Math.floor(index / 2)
    const altText = index < 48
      ? `${products[productIndex].name} ${index % 2 === 0 ? "front view" : "detail view"}`
      : ["Trendify Ghana editorial fashion", "Across Ghana craft collection", "Ghanaian textile craft story", "Accra regional style", "Cape Coast regional style"][index - 48]
    const publicId = index < 48
      ? `${SIMULATION_PREFIX}/products/${slugify(products[productIndex].name)}-${index % 2 === 0 ? "primary" : "detail"}`
      : `${SIMULATION_PREFIX}/editorial/editorial-${index - 47}`
    const row = await prisma.mediaAsset.upsert({
      where: { publicId },
      create: { publicId, url, secureUrl: url, format: "jpg", mimeType: "image/jpeg", altText },
      update: { url, secureUrl: url, format: "jpg", mimeType: "image/jpeg", altText, deletedAt: null },
    })
    rows.push(row.id)
  }
  return rows
}

async function seedProducts(
  maps: Awaited<ReturnType<typeof seedFoundation>>,
  mediaIds: string[]
) {
  const productRows = new Map<string, string>()
  for (const [index, definition] of products.entries()) {
    const slug = slugify(definition.name)
    const brandId = maps.brandRows.get(definition.brandSlug)!
    const artisanId = maps.artisanRows.get(definition.artisanSlug)!
    const sizeGuideId = maps.guideRows.get(guideKeyFor(definition.categorySlug))!
    const shortDescription = definition.design
    const description = `<p>${definition.design}</p><p>Made in Ghana in collaboration with ${artisans.find((artisan) => artisan.slug === definition.artisanSlug)!.name}, this piece belongs to the original Trendify catalogue simulation. Its materials and proportions are selected for real everyday wear, and every finish is described without claiming external certification or endorsement.</p>`
    const productData = {
      brandId, artisanId, sizeGuideId, name: definition.name, shortDescription, description,
      materialSummary: definition.material,
      careInstructions: "Spot clean or hand wash gently with mild soap as appropriate. Dry away from direct heat and store in a cool, dry place.",
      basePricePesewas: definition.price,
      compareAtPricePesewas: index % 5 === 0 ? definition.price + 8000 : null,
      costPricePesewas: Math.round(definition.price * 0.6), audience: definition.audience,
      status: "ACTIVE" as const, madeInGhana: true, featured: index % 3 === 0,
      newArrival: index % 2 === 0, seoTitle: `${definition.name} | Trendify Ghana`,
      seoDescription: `Shop ${definition.name}, an original Made-in-Ghana ${definition.categorySlug.replaceAll("-", " ")} design from ${brands.find((brand) => brand.slug === definition.brandSlug)!.name}.`,
      publishedAt: SIMULATION_PUBLISHED_AT, deletedAt: null,
    }
    const row = await prisma.product.upsert({ where: { slug }, create: { slug, ...productData }, update: productData })
    productRows.set(slug, row.id)

    await prisma.$transaction(async (tx) => {
      const expectedVariants = variantsFor(definition, index)
      await tx.productVariant.deleteMany({ where: { productId: row.id, sku: { notIn: expectedVariants.map((variant) => variant.sku) } } })
      for (const variant of expectedVariants) {
        await tx.productVariant.upsert({
          where: { sku: variant.sku },
          create: { productId: row.id, ...variant },
          update: { productId: row.id, ...variant, reservedQuantity: 0, deletedAt: null },
        })
      }

      const categoryIds = [maps.categoryRows.get(definition.categorySlug)!, ...(definition.categorySlug !== "footwear" && guideKeyFor(definition.categorySlug) === "clothing" ? [maps.categoryRows.get("clothing")!] : [])]
      await tx.productCategory.deleteMany({ where: { productId: row.id, categoryId: { notIn: categoryIds } } })
      for (const [sortOrder, categoryId] of categoryIds.entries()) {
        await tx.productCategory.upsert({
          where: { productId_categoryId: { productId: row.id, categoryId } },
          create: { productId: row.id, categoryId, primary: sortOrder === 0, sortOrder },
          update: { primary: sortOrder === 0, sortOrder },
        })
      }

      const collectionIds = [maps.collectionRows.get(definition.collectionSlug)!, maps.collectionRows.get("across-ghana-edit")!].filter((id, position, values) => values.indexOf(id) === position)
      await tx.productCollection.deleteMany({ where: { productId: row.id, collectionId: { notIn: collectionIds } } })
      for (const [sortOrder, collectionId] of collectionIds.entries()) {
        await tx.productCollection.upsert({ where: { productId_collectionId: { productId: row.id, collectionId } }, create: { productId: row.id, collectionId, sortOrder }, update: { sortOrder } })
      }

      const tagIds = [maps.tagRows.get("made-in-ghana")!, maps.tagRows.get("handcrafted")!, ...definition.tagSlugs.map((tag) => maps.tagRows.get(tag)!)].filter((id, position, values) => values.indexOf(id) === position)
      await tx.productTag.deleteMany({ where: { productId: row.id, tagId: { notIn: tagIds } } })
      for (const tagId of tagIds) {
        await tx.productTag.upsert({ where: { productId_tagId: { productId: row.id, tagId } }, create: { productId: row.id, tagId }, update: {} })
      }

      const expectedMediaIds = [mediaIds[index * 2], mediaIds[index * 2 + 1]]
      await tx.productMedia.deleteMany({ where: { productId: row.id, mediaAssetId: { notIn: expectedMediaIds } } })
      await tx.productMedia.updateMany({ where: { productId: row.id }, data: { primary: false } })
      for (const [sortOrder, mediaAssetId] of expectedMediaIds.entries()) {
        await tx.productMedia.upsert({
          where: { productId_mediaAssetId: { productId: row.id, mediaAssetId } },
          create: { productId: row.id, mediaAssetId, altText: `${definition.name} ${sortOrder === 0 ? "front view" : "detail view"}`, sortOrder, primary: false },
          update: { variantId: null, altText: `${definition.name} ${sortOrder === 0 ? "front view" : "detail view"}`, sortOrder, primary: false },
        })
      }
      await tx.productMedia.update({ where: { productId_mediaAssetId: { productId: row.id, mediaAssetId: expectedMediaIds[0] } }, data: { primary: true } })
    })
  }
  return productRows
}

async function seedRecommendations(productRows: Map<string, string>) {
  const ids = products.map((product) => productRows.get(slugify(product.name))!)
  for (const [index, productId] of ids.entries()) {
    const desired = [
      { recommendedProductId: ids[(index + 1) % ids.length], type: "SIMILAR" as const, sortOrder: 0 },
      { recommendedProductId: ids[(index + 2) % ids.length], type: "SIMILAR" as const, sortOrder: 1 },
      { recommendedProductId: ids[(index + 8) % ids.length], type: "COMPLEMENTARY" as const, sortOrder: 2 },
    ]
    await prisma.productRecommendation.deleteMany({ where: { productId } })
    await prisma.productRecommendation.createMany({ data: desired.map((item) => ({ productId, ...item })) })
  }
}

async function seedOperations() {
  const promotions = [
    { code: "AKWAABA15", name: "Akwaaba 15%", description: "Welcome offer for the simulation catalogue.", type: "PERCENTAGE" as const, value: 15, minimumSubtotalPesewas: 30000, maximumDiscountPesewas: 20000, startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2030-12-31T23:59:59Z"), active: true },
    { code: "GHSTYLE100", name: "GH Style GHS 100", description: "GHS 100 off qualifying simulation orders.", type: "FIXED_AMOUNT" as const, value: 10000, minimumSubtotalPesewas: 60000, maximumDiscountPesewas: 10000, startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2030-12-31T23:59:59Z"), active: true },
    { code: "FREESHIPACCRA", name: "Expired Accra Delivery", description: "Expired free-delivery example.", type: "FREE_DELIVERY" as const, value: 0, minimumSubtotalPesewas: null, maximumDiscountPesewas: null, startsAt: new Date("2025-01-01T00:00:00Z"), endsAt: new Date("2025-03-31T23:59:59Z"), active: false },
    { code: "HERITAGE10", name: "Expired Heritage 10%", description: "Expired percentage example.", type: "PERCENTAGE" as const, value: 10, minimumSubtotalPesewas: 25000, maximumDiscountPesewas: 12000, startsAt: new Date("2025-04-01T00:00:00Z"), endsAt: new Date("2025-06-30T23:59:59Z"), active: false },
  ]
  for (const promotion of promotions) {
    await prisma.promotion.upsert({ where: { code: promotion.code }, create: { ...promotion, appliesToAll: true, usedCount: 0 }, update: { ...promotion, appliesToAll: true, deletedAt: null } })
  }
  const methods = [
    { code: "ACCRA_SAME_DAY", name: "Greater Accra Same-Day", description: "Same-day delivery within supported Greater Accra locations.", feePesewas: 3500, estimatedMinDays: 1, estimatedMaxDays: 1, regions: ["Greater Accra"], sortOrder: 0 },
    { code: "GH_STANDARD", name: "Nationwide Standard", description: "Tracked standard delivery across Ghana.", feePesewas: 6000, estimatedMinDays: 2, estimatedMaxDays: 5, regions: [], sortOrder: 1 },
  ]
  for (const method of methods) {
    await prisma.deliveryMethod.upsert({ where: { code: method.code }, create: { ...method, active: true }, update: { ...method, active: true, deletedAt: null } })
  }
  await prisma.storeSettings.upsert({
    where: { key: "default" },
    create: { key: "default", brandName: "Fashion Trendify GH", supportEmail: "support@trendify-simulation.test", supportPhone: "+233 20 000 2400", whatsappNumber: "+233 20 000 2400", address: "Simulation Studio, Accra, Ghana", socialLinks: { instagram: "https://instagram.com/trendifygh" }, checkoutConfig: { guestCheckout: true, reservationMinutes: 30, taxRateBasisPoints: 1500, freeDeliveryThresholdPesewas: 100000, country: "GH", currency: "GHS" } },
    update: { brandName: "Fashion Trendify GH", supportEmail: "support@trendify-simulation.test", supportPhone: "+233 20 000 2400", whatsappNumber: "+233 20 000 2400", address: "Simulation Studio, Accra, Ghana", socialLinks: { instagram: "https://instagram.com/trendifygh" }, checkoutConfig: { guestCheckout: true, reservationMinutes: 30, taxRateBasisPoints: 1500, freeDeliveryThresholdPesewas: 100000, country: "GH", currency: "GHS" } },
  })
}

async function seedContent(editorialMediaIds: string[]) {
  const pages = [
    ["about-us", "About Trendify Ghana", "PAGE", "Meet the original Ghanaian brands, artisans, and ideas behind this development catalogue."],
    ["shipping-delivery", "Shipping & Delivery", "PAGE", "Understand same-day Greater Accra and nationwide standard simulation delivery."],
    ["returns-exchanges", "Returns & Exchanges", "PAGE", "A clear simulation returns process for eligible unworn items."],
    ["support-help", "Support & Help", "FAQ", "Answers for ordering, sizing, delivery, payments, and product care."],
    ["privacy-policy", "Privacy Policy", "POLICY", "How the Trendify simulation demonstrates responsible handling of commerce data."],
    ["terms-of-service", "Terms of Service", "POLICY", "The terms governing use of this non-production commerce simulation."],
  ] as const
  for (const [index, [slug, title, type, excerpt]] of pages.entries()) {
    const data = { type, title, excerpt, body: `<h2>${title}</h2><p>${excerpt}</p><p>This page is complete development content for the Trendify Ghana simulation. Contact support for questions about catalogue items, checkout, delivery, or account use.</p>`, status: "PUBLISHED" as const, mediaAssetId: editorialMediaIds[index % editorialMediaIds.length], seoTitle: `${title} | Trendify Ghana`, seoDescription: excerpt, publishedAt: SIMULATION_PUBLISHED_AT, deletedAt: null }
    await prisma.contentPage.upsert({ where: { slug }, create: { slug, ...data }, update: data })
  }
}

async function seedHomepage(
  maps: Awaited<ReturnType<typeof seedFoundation>>,
  productRows: Map<string, string>,
  editorialMediaIds: string[],
  editorialUrls: string[]
) {
  const definitions = [
    { key: "hero", type: "HERO", heading: "Made Here. Worn Everywhere", eyebrow: "Contemporary Ghana", body: "Discover original fashion shaped by Ghanaian hands, materials, cities, and stories.", ctaLabel: "Shop the catalogue", ctaHref: "/shop", media: 0, items: [] },
    { key: "benefits", type: "BENEFITS", heading: "Made for Ghana, ready for you", eyebrow: null, body: "Thoughtful details from discovery to delivery.", ctaLabel: null, ctaHref: null, media: null, items: [["Made in Ghana", "Original work from Ghana-based fictional studios.", "workspace_premium"], ["Secure Mobile Money", "Checkout designed for familiar Ghanaian payment choices.", "payments"], ["Nationwide Delivery", "Greater Accra same-day and standard Ghana coverage.", "local_shipping"], ["Curated Craft", "Every material, maker, and finish has a clear story.", "verified"]] },
    { key: "category-grid", type: "CATEGORY_GRID", heading: "Find your next Ghanaian icon", eyebrow: "Shop by category", body: "Five considered routes into the full catalogue.", ctaLabel: "View all products", ctaHref: "/shop", media: null, items: [] },
    { key: "collection-spotlight", type: "COLLECTION_SPOTLIGHT", heading: "Across Ghana", eyebrow: "The editorial collection", body: "Accra structure, Kumasi leather, Northern weaving, and Cape Coast craft in one cross-brand edit.", ctaLabel: "Explore the edit", ctaHref: "/collections/across-ghana-edit", media: 1, items: [] },
    { key: "product-carousel", type: "PRODUCT_CAROUSEL", heading: "New Ghanaian Icons", eyebrow: "Freshly selected", body: "Eight distinctive pieces across all three simulation brands.", ctaLabel: "Shop new arrivals", ctaHref: "/shop?sort=newest", media: null, items: [] },
    { key: "heritage-story", type: "HERITAGE_STORY", heading: "Crafted by Hands, Carried by Story", eyebrow: "Our point of view", body: "Modern Ghanaian fashion can honour technique and place while remaining useful, personal, and forward-looking.", ctaLabel: "Read our story", ctaHref: "/about", media: 2, items: [] },
    { key: "regional-trends", type: "REGIONAL_TRENDS", heading: "Style signals across Ghana", eyebrow: "Regional trends", body: "Four regional moods, interpreted through the original Trendify universe.", ctaLabel: null, ctaHref: null, media: null, items: [["Accra", "Structured layers for energetic city days.", "location_city"], ["Kumasi", "Rich leather and warm brass details.", "diamond"], ["Tamale", "Breathable cloth and confident woven lines.", "texture"], ["Cape Coast", "Relaxed colour shaped by coast and craft.", "waves"]] },
    { key: "newsletter", type: "NEWSLETTER", heading: "Join the Trendify Circle", eyebrow: "Notes from the studios", body: "Receive new arrivals, maker stories, and Ghana-wide style edits.", ctaLabel: "Subscribe", ctaHref: "#newsletter", media: 4, items: [] },
  ] as const
  await prisma.homepageSection.updateMany({ data: { status: "DRAFT", enabled: false } })
  for (const [sortOrder, definition] of definitions.entries()) {
    const section = await prisma.homepageSection.upsert({
      where: { key: definition.key },
      create: { key: definition.key, type: definition.type, heading: definition.heading, eyebrow: definition.eyebrow, body: definition.body, ctaLabel: definition.ctaLabel, ctaHref: definition.ctaHref, mediaAssetId: definition.media == null ? null : editorialMediaIds[definition.media], status: "PUBLISHED", enabled: true, sortOrder, config: { simulation: true }, publishedAt: SIMULATION_PUBLISHED_AT },
      update: { type: definition.type, heading: definition.heading, eyebrow: definition.eyebrow, body: definition.body, ctaLabel: definition.ctaLabel, ctaHref: definition.ctaHref, mediaAssetId: definition.media == null ? null : editorialMediaIds[definition.media], status: "PUBLISHED", enabled: true, sortOrder, config: { simulation: true }, publishedAt: SIMULATION_PUBLISHED_AT, deletedAt: null },
    })
    await prisma.$transaction([
      prisma.homepageSectionItem.deleteMany({ where: { sectionId: section.id } }),
      prisma.homepageSectionProduct.deleteMany({ where: { sectionId: section.id } }),
      prisma.homepageSectionCategory.deleteMany({ where: { sectionId: section.id } }),
      prisma.homepageSectionCollection.deleteMany({ where: { sectionId: section.id } }),
    ])
    if (definition.items.length) {
      await prisma.homepageSectionItem.createMany({ data: definition.items.map(([title, body, icon], index) => ({ sectionId: section.id, title, body, icon, imageUrl: definition.key === "regional-trends" ? editorialUrls[(index + 1) % editorialUrls.length] : null, href: definition.key === "regional-trends" ? `/shop?region=${title.toLowerCase().replace(" ", "-")}` : null, sortOrder: index })) })
    }
    if (definition.key === "category-grid") {
      const categoryIds = ["clothing", "footwear", "bags", "jewellery", "accessories"].map((slug) => maps.categoryRows.get(slug)!)
      await prisma.homepageSectionCategory.createMany({ data: categoryIds.map((categoryId, index) => ({ sectionId: section.id, categoryId, sortOrder: index })) })
    }
    if (definition.key === "collection-spotlight") {
      await prisma.homepageSectionCollection.create({ data: { sectionId: section.id, collectionId: maps.collectionRows.get("across-ghana-edit")!, sortOrder: 0 } })
    }
    if (definition.key === "product-carousel") {
      const selected = [0, 8, 16, 4, 12, 20, 6, 22].map((index) => productRows.get(slugify(products[index].name))!)
      await prisma.homepageSectionProduct.createMany({ data: selected.map((productId, index) => ({ sectionId: section.id, productId, sortOrder: index })) })
    }
  }
}

async function main() {
  assertSeedAllowed()
  const imageUrls = await loadCuratedImageUrls()
  console.log(`Preflighting ${imageUrls.length} public design-export images before database writes...`)
  await preflightImageUrls(imageUrls)

  const beforeAuth = await authSnapshot()
  const editorialUrls = imageUrls.slice(48)
  const maps = await seedFoundation(editorialUrls)
  const mediaIds = await seedMedia(imageUrls)
  const productRows = await seedProducts(maps, mediaIds)
  await seedRecommendations(productRows)
  await seedOperations()
  await seedContent(mediaIds.slice(48))
  await seedHomepage(maps, productRows, mediaIds.slice(48), editorialUrls)

  const afterAuth = await authSnapshot()
  if (!isDeepStrictEqual(beforeAuth, afterAuth)) {
    throw new Error("Authentication safety check failed: a user or account identifier/timestamp changed")
  }

  const counts = await Promise.all([
    prisma.product.count({ where: { slug: { in: products.map((product) => slugify(product.name)) } } }),
    prisma.productVariant.count({ where: { sku: { startsWith: "SIM-" } } }),
    prisma.mediaAsset.count({ where: { publicId: { startsWith: SIMULATION_PREFIX } } }),
  ])
  console.log(`Simulation ready: ${counts[0]} products, ${counts[1]} variants, ${counts[2]} media assets.`)
  console.log(`Authentication records preserved: ${afterAuth.users.length} users and ${afterAuth.accounts.length} accounts unchanged.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
