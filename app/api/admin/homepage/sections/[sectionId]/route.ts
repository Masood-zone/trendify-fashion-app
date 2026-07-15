import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { homepageSchema } from "@/app/api/admin/homepage/sections/route"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ sectionId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = homepageSchema.partial().safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).sectionId
    const { items, productIds, categoryIds, collectionIds, ...data } =
      parsed.data
    const section = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.homepageSectionItem.deleteMany({ where: { sectionId: id } })
        await tx.homepageSectionItem.createMany({
          data: items.map((item) => ({ ...item, sectionId: id })),
        })
      }
      if (productIds) {
        await tx.homepageSectionProduct.deleteMany({ where: { sectionId: id } })
        await tx.homepageSectionProduct.createMany({
          data: productIds.map((productId, sortOrder) => ({
            sectionId: id,
            productId,
            sortOrder,
          })),
        })
      }
      if (categoryIds) {
        await tx.homepageSectionCategory.deleteMany({
          where: { sectionId: id },
        })
        await tx.homepageSectionCategory.createMany({
          data: categoryIds.map((categoryId, sortOrder) => ({
            sectionId: id,
            categoryId,
            sortOrder,
          })),
        })
      }
      if (collectionIds) {
        await tx.homepageSectionCollection.deleteMany({
          where: { sectionId: id },
        })
        await tx.homepageSectionCollection.createMany({
          data: collectionIds.map((collectionId, sortOrder) => ({
            sectionId: id,
            collectionId,
            sortOrder,
          })),
        })
      }
      return tx.homepageSection.update({
        where: { id },
        data: { ...data, config: data.config as never },
        include: {
          items: true,
          products: true,
          categories: true,
          collections: true,
        },
      })
    })
    await auditAdmin(
      guard.session.user.id,
      "homepage-section.update",
      "HomepageSection",
      id
    )
    return ok(section)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ sectionId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).sectionId
    await prisma.homepageSection.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED", enabled: false },
    })
    await auditAdmin(
      guard.session.user.id,
      "homepage-section.archive",
      "HomepageSection",
      id
    )
    return ok({ archived: true })
  } catch (error) {
    return serverError(error)
  }
}
