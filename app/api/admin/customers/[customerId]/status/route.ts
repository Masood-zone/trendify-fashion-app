import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
const schema = z.object({
  banned: z.boolean(),
  reason: z.string().max(500).optional(),
  expiresAt: z.coerce.date().optional().nullable(),
})
export async function PATCH(
  request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).customerId
    const customer = await prisma.user.update({
      where: { id },
      data: {
        banned: parsed.data.banned,
        banReason: parsed.data.banned ? parsed.data.reason : null,
        banExpires: parsed.data.banned ? parsed.data.expiresAt : null,
      },
    })
    if (parsed.data.banned)
      await prisma.session.deleteMany({ where: { userId: id } })
    await auditAdmin(
      guard.session.user.id,
      parsed.data.banned ? "customer.ban" : "customer.unban",
      "User",
      id
    )
    return ok(customer)
  } catch (error) {
    return serverError(error)
  }
}
