import { ok, serverError } from "@/lib/api-response"
import {
  attachGuestCookie,
  cartSummary,
  getOrCreateCart,
} from "@/services/storefront/cart"
export async function GET(request: Request) {
  try {
    const { cart, guestToken } = await getOrCreateCart(request)
    return attachGuestCookie(ok(cartSummary(cart)), guestToken)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(request: Request) {
  try {
    const { cart, guestToken } = await getOrCreateCart(request)
    const { prisma } = await import("@/lib/prisma")
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    return attachGuestCookie(ok({ cleared: true }), guestToken)
  } catch (error) {
    return serverError(error)
  }
}
