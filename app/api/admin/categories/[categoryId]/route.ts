import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { categorySchema } from "@/services/admin/schemas"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ categoryId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = categorySchema.partial().safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).categoryId
    if (parsed.data.parentId === id)
      return Response.json(
        { success: false, message: "A category cannot be its own parent" },
        { status: 422 }
      )
    const item = await prisma.category.update({
      where: { id },
      data: parsed.data,
    })
    await auditAdmin(guard.session.user.id, "category.update", "Category", id)
    return ok(item)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ categoryId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).categoryId
    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    })
    await auditAdmin(guard.session.user.id, "category.archive", "Category", id)
    return ok({ archived: true })
  } catch (error) {
    return serverError(error)
  }
}
