import { requireAdmin } from "@/lib/admin-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.homepageSection.findMany({
        where: { deletedAt: null },
        include: {
          mediaAsset: true,
          items: { orderBy: { sortOrder: "asc" } },
          products: {
            include: { product: true },
            orderBy: { sortOrder: "asc" },
          },
          categories: {
            include: { category: true },
            orderBy: { sortOrder: "asc" },
          },
          collections: {
            include: { collection: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
