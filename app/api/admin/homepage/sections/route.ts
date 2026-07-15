import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
export const homepageSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  type: z.enum([
    "HERO",
    "BENEFITS",
    "CATEGORY_GRID",
    "COLLECTION_SPOTLIGHT",
    "PRODUCT_CAROUSEL",
    "HERITAGE_STORY",
    "REGIONAL_TRENDS",
    "NEWSLETTER",
  ]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  mediaAssetId: z.cuid().optional().nullable(),
  eyebrow: z.string().max(100).optional(),
  heading: z.string().max(200).optional(),
  body: z.string().max(3000).optional(),
  ctaLabel: z.string().max(80).optional(),
  ctaHref: z.string().max(500).optional(),
  sortOrder: z.int().default(0),
  enabled: z.boolean().default(true),
  config: z.record(z.string(), z.unknown()).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        body: z.string().max(1000).optional(),
        icon: z.string().max(80).optional(),
        imageUrl: z.url().optional(),
        href: z.string().max(500).optional(),
        sortOrder: z.int().default(0),
      })
    )
    .optional(),
  productIds: z.array(z.cuid()).optional(),
  categoryIds: z.array(z.cuid()).optional(),
  collectionIds: z.array(z.cuid()).optional(),
})
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.homepageSection.findMany({
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
export async function POST(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = homepageSchema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const { items, productIds, categoryIds, collectionIds, ...data } =
      parsed.data
    const section = await prisma.homepageSection.create({
      data: {
        ...data,
        config: data.config as never,
        items: items ? { create: items } : undefined,
        products: productIds
          ? {
              create: productIds.map((productId, sortOrder) => ({
                productId,
                sortOrder,
              })),
            }
          : undefined,
        categories: categoryIds
          ? {
              create: categoryIds.map((categoryId, sortOrder) => ({
                categoryId,
                sortOrder,
              })),
            }
          : undefined,
        collections: collectionIds
          ? {
              create: collectionIds.map((collectionId, sortOrder) => ({
                collectionId,
                sortOrder,
              })),
            }
          : undefined,
      },
      include: {
        items: true,
        products: true,
        categories: true,
        collections: true,
      },
    })
    await auditAdmin(
      guard.session.user.id,
      "homepage-section.create",
      "HomepageSection",
      section.id
    )
    return ok(section, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
