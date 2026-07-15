import { requireAdmin } from "@/lib/admin-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const params = new URL(request.url).searchParams
    const q = params.get("q")?.trim()
    const status = params.get("status")
    const rating = Number(params.get("rating"))
    return ok(
      await prisma.review.findMany({
        where: {
          deletedAt: null,
          ...(status ? { status: status as never } : {}),
          ...(Number.isInteger(rating) && rating > 0 ? { rating } : {}),
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { body: { contains: q, mode: "insensitive" } },
                  { product: { name: { contains: q, mode: "insensitive" } } },
                  { user: { name: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {}),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
          orderItem: {
            select: { order: { select: { id: true, orderNumber: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
