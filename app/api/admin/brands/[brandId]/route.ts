import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { brandSchema } from "@/services/admin/schemas"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ brandId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = brandSchema.partial().safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).brandId
    const item = await prisma.brand.update({ where: { id }, data: parsed.data })
    await auditAdmin(guard.session.user.id, "brand.update", "Brand", id)
    return ok(item)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ brandId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).brandId
    await prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    })
    await auditAdmin(guard.session.user.id, "brand.archive", "Brand", id)
    return ok({ archived: true })
  } catch (error) {
    return serverError(error)
  }
}
