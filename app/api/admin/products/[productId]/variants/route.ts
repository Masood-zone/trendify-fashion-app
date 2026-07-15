import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { variantSchema } from "@/services/admin/schemas"
export async function GET(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.productVariant.findMany({
        where: { productId: (await context.params).productId, deletedAt: null },
        orderBy: { createdAt: "asc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = variantSchema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const variant = await prisma.productVariant.create({
      data: { ...parsed.data, productId: (await context.params).productId },
    })
    await auditAdmin(
      guard.session.user.id,
      "variant.create",
      "ProductVariant",
      variant.id
    )
    return ok(variant, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
