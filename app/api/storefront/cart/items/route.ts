import { z } from "zod"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  attachGuestCookie,
  cartInclude,
  cartSummary,
  getOrCreateCart,
} from "@/services/storefront/cart"
const schema = z.object({
  variantId: z.cuid(),
  quantity: z.int().min(1).max(20),
})
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const { cart, guestToken } = await getOrCreateCart(request)
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: parsed.data.variantId,
        active: true,
        deletedAt: null,
        product: { status: "ACTIVE", deletedAt: null },
      },
    })
    if (!variant) return fail("Product variant is unavailable", 404)
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    })
    const quantity = (existing?.quantity ?? 0) + parsed.data.quantity
    if (quantity > variant.stockQuantity - variant.reservedQuantity)
      return fail(
        "Requested quantity is not available",
        409,
        "INSUFFICIENT_STOCK"
      )
    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
      create: { cartId: cart.id, variantId: variant.id, quantity },
      update: { quantity },
    })
    const updated = await prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    })
    return attachGuestCookie(
      ok(cartSummary(updated), { status: 201 }),
      guestToken
    )
  } catch (error) {
    return serverError(error)
  }
}
