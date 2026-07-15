import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { deliveryMethodSchema } from "../route"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ deliveryMethodId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = deliveryMethodSchema
      .partial()
      .safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).deliveryMethodId
    const item = await prisma.deliveryMethod.update({
      where: { id },
      data: parsed.data,
    })
    await auditAdmin(
      guard.session.user.id,
      "delivery-method.update",
      "DeliveryMethod",
      id
    )
    return ok(item)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ deliveryMethodId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).deliveryMethodId
    const item = await prisma.deliveryMethod.update({
      where: { id },
      data: { active: false, deletedAt: new Date() },
    })
    await auditAdmin(
      guard.session.user.id,
      "delivery-method.archive",
      "DeliveryMethod",
      id
    )
    return ok(item)
  } catch (error) {
    return serverError(error)
  }
}
