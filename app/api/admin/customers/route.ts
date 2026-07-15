import { requireAdmin } from "@/lib/admin-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const q = new URL(request.url).searchParams.get("q")
    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        banned: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          select: {
            totalPesewas: true,
            createdAt: true,
            payments: {
              where: { status: "SUCCESS" },
              select: { id: true },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return ok(
      customers.map((customer) => ({
        ...customer,
        lifetimeSpendPesewas: customer.orders
          .filter((order) => order.payments.length > 0)
          .reduce((sum, order) => sum + order.totalPesewas, 0),
        lastOrderAt: customer.orders[0]?.createdAt ?? null,
        orders: undefined,
      }))
    )
  } catch (error) {
    return serverError(error)
  }
}
