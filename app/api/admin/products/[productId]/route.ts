import { requireAdmin } from "@/lib/admin-api"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { productPayloadSchema } from "@/services/admin/schemas"
export async function GET(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const product = await prisma.product.findFirst({
      where: { id: (await context.params).productId, deletedAt: null },
      include: {
        brand: true,
        artisan: true,
        sizeGuide: true,
        variants: true,
        media: { include: { mediaAsset: true } },
        categories: true,
        collections: true,
        tags: true,
        recommendations: true,
      },
    })
    return product ? ok(product) : fail("Product not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = productPayloadSchema
      .partial()
      .safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).productId
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
      let sizeGuideId = data.sizeGuideId
      if (sizeGuide) {
        const current = await tx.product.findUniqueOrThrow({
          where: { id },
          select: { sizeGuideId: true },
        })
        if (current.sizeGuideId) {
          await tx.sizeGuide.update({
            where: { id: current.sizeGuideId },
            data: {
              ...sizeGuide,
              measurements: sizeGuide.measurements as never,
            },
          })
          sizeGuideId = current.sizeGuideId
        } else {
          sizeGuideId = (
            await tx.sizeGuide.create({
              data: {
                ...sizeGuide,
                measurements: sizeGuide.measurements as never,
              },
            })
          ).id
        }
      }
      if (categoryIds) {
        await tx.productCategory.deleteMany({ where: { productId: id } })
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId, index) => ({
            productId: id,
            categoryId,
            primary: index === 0,
            sortOrder: index,
          })),
        })
      }
      if (collectionIds) {
        await tx.productCollection.deleteMany({ where: { productId: id } })
        await tx.productCollection.createMany({
          data: collectionIds.map((collectionId, index) => ({
            productId: id,
            collectionId,
            sortOrder: index,
          })),
        })
      }
      if (tags) {
        await tx.productTag.deleteMany({ where: { productId: id } })
        for (const tag of tags) {
          const saved = await tx.tag.upsert({
            where: { slug: tag.slug },
            create: tag,
            update: { name: tag.name },
          })
          await tx.productTag.create({
            data: { productId: id, tagId: saved.id },
          })
        }
      }
      if (media) {
        await tx.productMedia.deleteMany({ where: { productId: id } })
        await tx.productMedia.createMany({
          data: media.map((item) => ({ ...item, productId: id })),
        })
      }
      if (recommendations) {
        await tx.productRecommendation.deleteMany({ where: { productId: id } })
        await tx.productRecommendation.createMany({
          data: recommendations.map((item) => ({ ...item, productId: id })),
        })
      }
      return tx.product.update({
        where: { id },
        data: { ...data, sizeGuideId },
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
    await auditAdmin(guard.session.user.id, "product.update", "Product", id)
    return ok(product)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).productId
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    })
    await auditAdmin(guard.session.user.id, "product.archive", "Product", id)
    return ok({ archived: true })
  } catch (error) {
    return serverError(error)
  }
}
