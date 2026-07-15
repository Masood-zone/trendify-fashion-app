import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { variantSchema } from "@/services/admin/schemas"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ variantId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = variantSchema
      .omit({ stockQuantity: true })
      .partial()
      .safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).variantId
    const variant = await prisma.productVariant.update({
      where: { id },
      data: parsed.data,
    })
    await auditAdmin(
      guard.session.user.id,
      "variant.update",
      "ProductVariant",
      id
    )
    return ok(variant)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ variantId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).variantId
    await prisma.productVariant.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    })
    await auditAdmin(
      guard.session.user.id,
      "variant.archive",
      "ProductVariant",
      id
    )
    return ok({ archived: true })
  } catch (error) {
    return serverError(error)
  }
}
