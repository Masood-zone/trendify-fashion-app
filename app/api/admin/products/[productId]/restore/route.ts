import { requireAdmin } from "@/lib/admin-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const id = (await context.params).productId
    const product = await prisma.product.update({
      where: { id },
      data: { deletedAt: null, status: "DRAFT" },
    })
    await auditAdmin(guard.session.user.id, "product.restore", "Product", id)
    return ok(product)
  } catch (error) {
    return serverError(error)
  }
}
