import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { promotionSchema } from "@/app/api/admin/promotions/route"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ promotionId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = promotionSchema.partial().safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).promotionId
    const { productIds, categoryIds, ...data } = parsed.data
    const item = await prisma.$transaction(async (tx) => {
      if (productIds) {
        await tx.promotionProduct.deleteMany({ where: { promotionId: id } })
        await tx.promotionProduct.createMany({
          data: productIds.map((productId) => ({ promotionId: id, productId })),
        })
      }
      if (categoryIds) {
        await tx.promotionCategory.deleteMany({ where: { promotionId: id } })
        await tx.promotionCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            promotionId: id,
            categoryId,
          })),
        })
      }
      return tx.promotion.update({
        where: { id },
        data,
        include: { products: true, categories: true },
      })
    })
    await auditAdmin(guard.session.user.id, "promotion.update", "Promotion", id)
    return ok(item)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ promotionId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).promotionId
    await prisma.promotion.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    })
    await auditAdmin(
      guard.session.user.id,
      "promotion.archive",
      "Promotion",
      id
    )
    return ok({ archived: true })
  } catch (error) {
    return serverError(error)
  }
}
