import { requireAdmin } from "@/lib/admin-api"
import { fail, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ variantId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).variantId
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        inventoryMovements: {
          include: { actor: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    return variant ? ok(variant) : fail("Inventory variant not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
