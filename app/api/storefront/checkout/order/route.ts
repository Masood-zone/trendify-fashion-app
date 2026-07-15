import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { checkoutSchema, createOrder } from "@/services/orders/create-order"
export async function POST(request: Request) {
  try {
    const parsed = checkoutSchema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    try {
      const result = await createOrder(request, parsed.data)
      return ok(
        {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          totalPesewas: result.order.totalPesewas,
          subtotalPesewas: result.order.subtotalPesewas,
          discountPesewas: result.order.discountPesewas,
          taxPesewas: result.order.taxPesewas,
          deliveryFeePesewas: result.order.deliveryFeePesewas,
          currency: result.order.currency,
          reservationExpiresAt: result.order.reservationExpiresAt,
          guestAccessToken: result.guestAccessToken,
        },
        { status: 201 }
      )
    } catch (error) {
      return fail(
        error instanceof Error ? error.message : "Order could not be created",
        409,
        "ORDER_CREATION_FAILED"
      )
    }
  } catch (error) {
    return serverError(error)
  }
}
