import { requireAdmin } from "@/lib/admin-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const params = new URL(request.url).searchParams
    const status = params.get("status")
    return ok(
      await prisma.order.findMany({
        where: { ...(status ? { status: status as never } : {}) },
        include: {
          items: true,
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
