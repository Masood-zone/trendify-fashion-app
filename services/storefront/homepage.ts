import type { HomepageSectionType } from "@/app/generated/prisma/enums"

export const CANONICAL_HOMEPAGE_SLOTS = [
  { key: "hero", type: "HERO", sortOrder: 0 },
  { key: "benefits", type: "BENEFITS", sortOrder: 1 },
  { key: "category-grid", type: "CATEGORY_GRID", sortOrder: 2 },
  { key: "collection-spotlight", type: "COLLECTION_SPOTLIGHT", sortOrder: 3 },
  { key: "product-carousel", type: "PRODUCT_CAROUSEL", sortOrder: 4 },
  { key: "heritage-story", type: "HERITAGE_STORY", sortOrder: 5 },
  { key: "regional-trends", type: "REGIONAL_TRENDS", sortOrder: 6 },
  { key: "newsletter", type: "NEWSLETTER", sortOrder: 7 },
] as const satisfies ReadonlyArray<{
  key: string
  type: HomepageSectionType
  sortOrder: number
}>

export function canonicalHomepageSlot(key: string) {
  return CANONICAL_HOMEPAGE_SLOTS.find((slot) => slot.key === key)
}
