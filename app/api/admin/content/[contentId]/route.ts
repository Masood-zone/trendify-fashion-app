import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { contentSchema } from "@/app/api/admin/content/route"
import sanitizeHtml from "sanitize-html"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ contentId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = contentSchema.partial().safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).contentId
    const item = await prisma.contentPage.update({
      where: { id },
      data: {
        ...parsed.data,
        body:
          parsed.data.body === undefined
            ? undefined
            : sanitizeHtml(parsed.data.body),
      },
    })
    await auditAdmin(guard.session.user.id, "content.update", "ContentPage", id)
    return ok(item)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ contentId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).contentId
    await prisma.contentPage.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    })
    await auditAdmin(
      guard.session.user.id,
      "content.archive",
      "ContentPage",
      id
    )
    return ok({ archived: true })
  } catch (error) {
    return serverError(error)
  }
}
