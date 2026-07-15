import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { collectionSchema } from "@/services/admin/schemas"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ collectionId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = collectionSchema.partial().safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).collectionId
    const item = await prisma.collection.update({
      where: { id },
      data: parsed.data,
    })
    await auditAdmin(
      guard.session.user.id,
      "collection.update",
      "Collection",
      id
    )
    return ok(item)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ collectionId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).collectionId
    await prisma.collection.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    })
    await auditAdmin(
      guard.session.user.id,
      "collection.archive",
      "Collection",
      id
    )
    return ok({ archived: true })
  } catch (error) {
    return serverError(error)
  }
}
