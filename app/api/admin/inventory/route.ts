import { requireAdmin } from "@/lib/admin-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const params = new URL(request.url).searchParams
    const low = params.get("lowStock") === "true"
    return ok(
      await prisma.productVariant.findMany({
        where: {
          deletedAt: null,
          ...(low ? { stockQuantity: { lte: 5 } } : {}),
        },
        include: {
          product: { select: { id: true, name: true, slug: true } },
          inventoryMovements: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { updatedAt: "desc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
