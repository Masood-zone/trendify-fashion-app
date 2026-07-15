import { z } from "zod"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { resolveShopper } from "@/lib/shopper-context"
import { getOrCreateCart } from "@/services/storefront/cart"
import { evaluatePromotion } from "@/services/storefront/promotions"
const schema = z.object({
  code: z.string().trim().min(1),
  subtotalPesewas: z.int().nonnegative().optional(),
  email: z.email().optional(),
})
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const shopper = await resolveShopper(request)
    const { cart } = await getOrCreateCart(request)
    const subtotalPesewas = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.variant.pricePesewas,
      0
    )
    try {
      const result = await evaluatePromotion(
        parsed.data.code,
        subtotalPesewas,
        shopper.userId,
        parsed.data.email,
        cart.items.map((item) => ({
          productId: item.variant.product.id,
          categoryIds: item.variant.product.categories.map(
            (entry) => entry.categoryId
          ),
          lineTotalPesewas: item.quantity * item.variant.pricePesewas,
        }))
      )
      return ok({
        code: result.promotion.code,
        name: result.promotion.name,
        discountPesewas: result.discountPesewas,
      })
    } catch (error) {
      return fail(
        error instanceof Error ? error.message : "Promotion is invalid",
        422,
        "INVALID_PROMOTION"
      )
    }
  } catch (error) {
    return serverError(error)
  }
}
