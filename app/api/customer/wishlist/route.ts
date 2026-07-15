import { requireCustomer } from "@/lib/customer-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  publicProductInclude,
  publicProductWhere,
} from "@/services/storefront/catalog"
export async function GET(request: Request) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.wishlistItem.findMany({
        where: { userId: guard.session.user.id, product: publicProductWhere },
        include: { product: { include: publicProductInclude } },
        orderBy: { createdAt: "desc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
