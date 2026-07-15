import { fail, ok, serverError } from "@/lib/api-response"
import { requireCustomer } from "@/lib/customer-api"
import { prisma } from "@/lib/prisma"
import { publicProductWhere } from "@/services/storefront/catalog"
export async function PUT(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const productId = (await context.params).productId
    const product = await prisma.product.findFirst({
      where: { id: productId, ...publicProductWhere },
    })
    if (!product) return fail("Product not found", 404)
    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: guard.session.user.id, productId } },
      create: { userId: guard.session.user.id, productId },
      update: {},
    })
    return ok(item, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    await prisma.wishlistItem.deleteMany({
      where: {
        userId: guard.session.user.id,
        productId: (await context.params).productId,
      },
    })
    return ok({ removed: true })
  } catch (error) {
    return serverError(error)
  }
}
