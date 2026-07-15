import { z } from "zod"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  attachGuestCookie,
  cartInclude,
  cartSummary,
  getOrCreateCart,
} from "@/services/storefront/cart"
const schema = z.object({ quantity: z.int().min(1).max(20) })
export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const { cart, guestToken } = await getOrCreateCart(request)
    const item = await prisma.cartItem.findFirst({
      where: { id: (await context.params).itemId, cartId: cart.id },
      include: { variant: true },
    })
    if (!item) return fail("Cart item not found", 404)
    if (
      parsed.data.quantity >
      item.variant.stockQuantity - item.variant.reservedQuantity
    )
      return fail(
        "Requested quantity is not available",
        409,
        "INSUFFICIENT_STOCK"
      )
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: parsed.data.quantity },
    })
    const updated = await prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    })
    return attachGuestCookie(ok(cartSummary(updated)), guestToken)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { cart, guestToken } = await getOrCreateCart(request)
    const result = await prisma.cartItem.deleteMany({
      where: { id: (await context.params).itemId, cartId: cart.id },
    })
    if (!result.count) return fail("Cart item not found", 404)
    const updated = await prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    })
    return attachGuestCookie(ok(cartSummary(updated)), guestToken)
  } catch (error) {
    return serverError(error)
  }
}
