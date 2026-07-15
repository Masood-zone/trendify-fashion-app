import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { productPayloadSchema } from "@/services/admin/schemas"
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const q = new URL(request.url).searchParams.get("q")
    return ok(
      await prisma.product.findMany({
        where: {
          deletedAt: null,
          ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        },
        include: { brand: true, artisan: true, variants: true },
        orderBy: { updatedAt: "desc" },
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
    const parsed = productPayloadSchema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const {
      categoryIds,
      collectionIds,
      tags,
      media,
      recommendations,
      sizeGuide,
      ...data
    } = parsed.data
    const product = await prisma.$transaction(async (tx) => {
      const guide = sizeGuide
        ? await tx.sizeGuide.create({
            data: {
              ...sizeGuide,
              measurements: sizeGuide.measurements as never,
            },
          })
        : undefined
      return tx.product.create({
        data: {
          ...data,
          sizeGuideId: guide?.id ?? data.sizeGuideId,
          categories: categoryIds
            ? {
                create: categoryIds.map((categoryId, index) => ({
                  categoryId,
                  primary: index === 0,
                  sortOrder: index,
                })),
              }
            : undefined,
          collections: collectionIds
            ? {
                create: collectionIds.map((collectionId, index) => ({
                  collectionId,
                  sortOrder: index,
                })),
              }
            : undefined,
          tags: tags
            ? {
                create: tags.map((tag) => ({
                  tag: {
                    connectOrCreate: { where: { slug: tag.slug }, create: tag },
                  },
                })),
              }
            : undefined,
          media: media ? { create: media } : undefined,
          recommendations: recommendations
            ? { create: recommendations }
            : undefined,
        },
        include: {
          variants: true,
          media: true,
          categories: true,
          collections: true,
          tags: true,
          recommendations: true,
          sizeGuide: true,
        },
      })
    })
    await auditAdmin(
      guard.session.user.id,
      "product.create",
      "Product",
      product.id
    )
    return ok(product, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
