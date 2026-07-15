import { requireAdmin } from "@/lib/admin-api"
import { fail, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const review = await prisma.review.findFirst({
      where: { id: (await context.params).reviewId, deletedAt: null },
      include: {
        user: true,
        product: true,
        orderItem: { include: { order: true } },
      },
    })
    return review ? ok(review) : fail("Review not found", 404)
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).reviewId
    const review = await prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    return ok(review)
  } catch (error) {
    return serverError(error)
  }
}
