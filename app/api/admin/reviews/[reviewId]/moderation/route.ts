import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"

const schema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  adminNote: z.string().trim().max(1000).optional().nullable(),
})
export async function PATCH(
  request: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).reviewId
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...parsed.data,
        moderatedAt: parsed.data.status === "PENDING" ? null : new Date(),
      },
    })
    await auditAdmin(
      guard.session.user.id,
      "review.moderate",
      "Review",
      id,
      parsed.data
    )
    return ok(review)
  } catch (error) {
    return serverError(error)
  }
}
