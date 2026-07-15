import { requireCustomer } from "@/lib/customer-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
export async function GET(request: Request) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const params = new URL(request.url).searchParams
    const page = Math.max(1, Number(params.get("page")) || 1)
    const pageSize = Math.min(
      50,
      Math.max(1, Number(params.get("pageSize")) || 20)
    )
    const where = { userId: guard.session.user.id }
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ])
    return ok({
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    })
  } catch (error) {
    return serverError(error)
  }
}
