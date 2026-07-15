import { z } from "zod"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { requireCustomer } from "@/lib/customer-api"
import { prisma } from "@/lib/prisma"
const schema = z.object({
  orderItemId: z.cuid(),
  rating: z.int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(5).max(3000),
})
export async function GET(request: Request) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.review.findMany({
        where: { userId: guard.session.user.id, deletedAt: null },
        include: { product: true, orderItem: true },
        orderBy: { createdAt: "desc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
export async function POST(request: Request) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const item = await prisma.orderItem.findFirst({
      where: {
        id: parsed.data.orderItemId,
        productId: { not: null },
        order: { userId: guard.session.user.id, status: "DELIVERED" },
      },
    })
    if (!item?.productId)
      return fail("Only delivered purchases can be reviewed", 403)
    const review = await prisma.review.create({
      data: {
        ...parsed.data,
        userId: guard.session.user.id,
        productId: item.productId,
      },
    })
    return ok(review, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
