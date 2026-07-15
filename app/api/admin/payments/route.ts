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
    const providerStatus = params.get("providerStatus")
    return ok(
      await prisma.payment.findMany({
        where: {
          ...(status ? { status: status as never } : {}),
          ...(providerStatus ? { providerStatus } : {}),
          ...(q
            ? {
                OR: [
                  { reference: { contains: q, mode: "insensitive" } },
                  {
                    order: {
                      orderNumber: { contains: q, mode: "insensitive" },
                    },
                  },
                  { order: { email: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {}),
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
