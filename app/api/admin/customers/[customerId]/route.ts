import { requireAdmin } from "@/lib/admin-api"
import { fail, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
export async function GET(
  request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const customer = await prisma.user.findFirst({
      where: { id: (await context.params).customerId, role: "CUSTOMER" },
      include: {
        addresses: { where: { deletedAt: null } },
        orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
        reviews: { where: { deletedAt: null } },
      },
    })
    return customer ? ok(customer) : fail("Customer not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
