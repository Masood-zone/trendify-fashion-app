import { z } from "zod"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { requireCustomer } from "@/lib/customer-api"
import { prisma } from "@/lib/prisma"
const schema = z.object({
  rating: z.int().min(1).max(5).optional(),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(5).max(3000).optional(),
})
export async function PATCH(
  request: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).reviewId
    const result = await prisma.review.updateMany({
      where: { id, userId: guard.session.user.id, deletedAt: null },
      data: {
        ...parsed.data,
        status: "PENDING",
        moderatedAt: null,
        adminNote: null,
      },
    })
    return result.count
      ? ok(await prisma.review.findUniqueOrThrow({ where: { id } }))
      : fail("Review not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const result = await prisma.review.updateMany({
      where: {
        id: (await context.params).reviewId,
        userId: guard.session.user.id,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    })
    return result.count ? ok({ archived: true }) : fail("Review not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
