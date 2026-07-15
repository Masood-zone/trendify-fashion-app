import { PromotionType } from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

type PromotionLine = {
  productId: string
  categoryIds: string[]
  lineTotalPesewas: number
}

export async function evaluatePromotion(
  code: string,
  subtotalPesewas: number,
  userId?: string,
  email?: string,
  lines: PromotionLine[] = []
) {
  const now = new Date()
  const promotion = await prisma.promotion.findFirst({
    where: {
      code: code.trim().toUpperCase(),
      active: true,
      deletedAt: null,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    include: { products: true, categories: true },
  })
  if (!promotion) throw new Error("Promotion is invalid or expired")
  if (
    promotion.minimumSubtotalPesewas &&
    subtotalPesewas < promotion.minimumSubtotalPesewas
  )
    throw new Error("Order does not meet the promotion minimum")
  if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit)
    throw new Error("Promotion usage limit has been reached")
  if (promotion.perCustomerLimit) {
    const count = await prisma.promotionRedemption.count({
      where: {
        promotionId: promotion.id,
        ...(userId ? { userId } : { guestEmail: email?.toLowerCase() }),
      },
    })
    if (count >= promotion.perCustomerLimit)
      throw new Error("Promotion has already been used")
  }
  const eligibleSubtotalPesewas = promotion.appliesToAll
    ? subtotalPesewas
    : lines
        .filter(
          (line) =>
            promotion.products.some(
              (scope) => scope.productId === line.productId
            ) ||
            promotion.categories.some((scope) =>
              line.categoryIds.includes(scope.categoryId)
            )
        )
        .reduce((sum, line) => sum + line.lineTotalPesewas, 0)
  if (!promotion.appliesToAll && eligibleSubtotalPesewas === 0)
    throw new Error("Promotion does not apply to items in this cart")
  let discountPesewas =
    promotion.type === PromotionType.PERCENTAGE
      ? Math.floor((eligibleSubtotalPesewas * promotion.value) / 10000)
      : promotion.type === PromotionType.FIXED_AMOUNT
        ? promotion.value
        : 0
  discountPesewas = Math.min(
    discountPesewas,
    promotion.maximumDiscountPesewas ?? discountPesewas,
    eligibleSubtotalPesewas
  )
  return { promotion, discountPesewas }
}
