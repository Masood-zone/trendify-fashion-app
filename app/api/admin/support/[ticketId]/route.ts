import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
const schema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  adminNotes: z.string().max(5000).optional().nullable(),
})
export async function GET(
  request: Request,
  context: { params: Promise<{ ticketId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const item = await prisma.supportTicket.findFirst({
      where: { id: (await context.params).ticketId, deletedAt: null },
      include: { user: true },
    })
    return item ? ok(item) : fail("Support ticket not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
export async function PATCH(
  request: Request,
  context: { params: Promise<{ ticketId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).ticketId
    const item = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...parsed.data,
        resolvedAt: parsed.data.status === "RESOLVED" ? new Date() : null,
      },
    })
    await auditAdmin(
      guard.session.user.id,
      "support.update",
      "SupportTicket",
      id
    )
    return ok(item)
  } catch (error) {
    return serverError(error)
  }
}
