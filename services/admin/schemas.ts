import { z } from "zod"

export const slug = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug,
  description: z.string().trim().max(20000).default(""),
  shortDescription: z.string().max(300).optional(),
  brandId: z.cuid().optional().nullable(),
  artisanId: z.cuid().optional().nullable(),
  sizeGuideId: z.cuid().optional().nullable(),
  materialSummary: z.string().max(500).optional(),
  careInstructions: z.string().max(2000).optional(),
  audience: z.enum(["MEN", "WOMEN", "UNISEX"]).optional().nullable(),
  basePricePesewas: z.int().nonnegative().default(0),
  compareAtPricePesewas: z.int().nonnegative().optional().nullable(),
  costPricePesewas: z.int().nonnegative().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  madeInGhana: z.boolean().default(false),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  publishedAt: z.coerce.date().optional().nullable(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(300).optional(),
})
const productPayloadBaseSchema = productSchema.extend({
  categoryIds: z.array(z.cuid()).optional(),
  collectionIds: z.array(z.cuid()).optional(),
  tags: z
    .array(z.object({ name: z.string().trim().min(1).max(80), slug }))
    .optional(),
  media: z
    .array(
      z.object({
        mediaAssetId: z.cuid(),
        variantId: z.cuid().optional().nullable(),
        altText: z.string().max(200).optional(),
        sortOrder: z.int().default(0),
        primary: z.boolean().default(false),
      })
    )
    .optional(),
  recommendations: z
    .array(
      z.object({
        recommendedProductId: z.cuid(),
        type: z.enum(["COMPLEMENTARY", "SIMILAR"]).default("COMPLEMENTARY"),
        sortOrder: z.int().default(0),
      })
    )
    .optional(),
  sizeGuide: z
    .object({
      name: z.string().min(2).max(120),
      description: z.string().max(1000).optional(),
      measurementUnit: z.string().max(20).default("cm"),
      measurements: z.record(z.string(), z.unknown()),
    })
    .optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().trim().min(2).max(80),
        sizeLabel: z.string().max(50).optional().nullable(),
        colorName: z.string().max(80).optional().nullable(),
        colorHex: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional()
          .nullable(),
        pricePesewas: z.int().nonnegative(),
        compareAtPricePesewas: z.int().nonnegative().optional().nullable(),
        stockQuantity: z.int().nonnegative().default(0),
        lowStockThreshold: z.int().nonnegative().default(5),
        weightGrams: z.int().positive().optional().nullable(),
        active: z.boolean().default(true),
      })
    )
    .optional(),
})

function addProductPayloadRefinements<Schema extends z.ZodType>(schema: Schema) {
  return schema.superRefine((payload, context) => {
    const data = payload as Partial<z.infer<typeof productPayloadBaseSchema>>

    const rejectDuplicates = <Item>(
      items: Item[] | undefined,
      key: (item: Item) => string,
      path: string,
      message: string
    ) => {
      const seen = new Set<string>()
      items?.forEach((item, index) => {
        const value = key(item)
        if (seen.has(value)) {
          context.addIssue({ code: "custom", path: [path, index], message })
        }
        seen.add(value)
      })
    }

    const primaryIndexes =
      data.media
        ?.map((item, index) => (item.primary ? index : -1))
        .filter((index) => index >= 0) ?? []
    for (const index of primaryIndexes.slice(1)) {
      context.addIssue({
        code: "custom",
        path: ["media", index, "primary"],
        message: "Only one product image can be primary",
      })
    }

    rejectDuplicates(data.media, (item) => item.mediaAssetId, "media", "Each media asset can only be attached once")
    rejectDuplicates(data.categoryIds, (item) => item, "categoryIds", "Each category can only be selected once")
    rejectDuplicates(data.collectionIds, (item) => item, "collectionIds", "Each collection can only be selected once")
    rejectDuplicates(data.tags, (item) => item.slug.toLowerCase(), "tags", "Each tag can only be selected once")
    rejectDuplicates(
      data.recommendations,
      (item) => `${item.recommendedProductId}:${item.type}`,
      "recommendations",
      "Each recommendation and type can only be selected once"
    )
    rejectDuplicates(data.variants, (item) => item.sku.toLowerCase(), "variants", "Each SKU must be unique")
    rejectDuplicates(
      data.variants,
      (item) => `${item.sizeLabel?.trim().toLowerCase() ?? ""}:${item.colorName?.trim().toLowerCase() ?? ""}`,
      "variants",
      "Each size and colour combination must be unique"
    )
  })
}

export const productPayloadSchema = addProductPayloadRefinements(productPayloadBaseSchema)
export const productPatchPayloadSchema = addProductPayloadRefinements(productPayloadBaseSchema.partial())
export const variantSchema = z.object({
  sku: z.string().trim().min(2).max(80),
  sizeLabel: z.string().max(50).optional().nullable(),
  colorName: z.string().max(80).optional().nullable(),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable(),
  pricePesewas: z.int().nonnegative(),
  compareAtPricePesewas: z.int().nonnegative().optional().nullable(),
  stockQuantity: z.int().nonnegative().default(0),
  lowStockThreshold: z.int().nonnegative().default(5),
  weightGrams: z.int().positive().optional().nullable(),
  active: z.boolean().default(true),
})
export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().max(1000).optional(),
  parentId: z.cuid().optional().nullable(),
  imageUrl: z.url().optional().nullable(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.int().default(0),
})
export const collectionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().max(2000).optional(),
  imageUrl: z.url().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  sortOrder: z.int().default(0),
  publishedAt: z.coerce.date().optional().nullable(),
})
export const brandSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().max(2000).optional(),
  logoUrl: z.url().optional().nullable(),
  websiteUrl: z.url().optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.int().default(0),
})
export const artisanSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().max(1000).optional(),
  biography: z.string().max(5000).optional(),
  region: z.string().max(80).optional(),
  imageUrl: z.url().optional().nullable(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.int().default(0),
})
