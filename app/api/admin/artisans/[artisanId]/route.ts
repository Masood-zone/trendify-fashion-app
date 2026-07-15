import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { artisanSchema } from "@/services/admin/schemas"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ artisanId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = artisanSchema.partial().safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).artisanId
    const item = await prisma.artisan.update({
      where: { id },
      data: parsed.data,
    })
    await auditAdmin(guard.session.user.id, "artisan.update", "Artisan", id)
    return ok(item)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ artisanId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).artisanId
    await prisma.artisan.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    })
    await auditAdmin(guard.session.user.id, "artisan.archive", "Artisan", id)
    return ok({ archived: true })
  } catch (error) {
    return serverError(error)
  }
}
