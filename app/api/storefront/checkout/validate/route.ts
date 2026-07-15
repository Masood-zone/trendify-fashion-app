import { fail, invalid, ok, serverError } from "@/lib/api-response"
import {
  calculateCheckout,
  checkoutSchema,
} from "@/services/orders/create-order"
export async function POST(request: Request) {
  try {
    const parsed = checkoutSchema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    try {
      const result = await calculateCheckout(request, parsed.data)
      return ok({
        subtotalPesewas: result.subtotalPesewas,
        discountPesewas: result.discountPesewas,
        deliveryFeePesewas: result.deliveryFeePesewas,
        totalPesewas: result.totalPesewas,
        currency: "GHS",
      })
    } catch (error) {
      return fail(
        error instanceof Error ? error.message : "Checkout is invalid",
        422,
        "CHECKOUT_INVALID"
      )
    }
  } catch (error) {
    return serverError(error)
  }
}
