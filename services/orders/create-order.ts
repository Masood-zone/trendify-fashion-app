import { randomBytes } from "node:crypto"
import { z } from "zod"

import {
  NotificationTemplate,
  OrderEventType,
} from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { hashShopperToken, resolveShopper } from "@/lib/shopper-context"
import { reserveInventory } from "@/services/inventory/inventory"
import {
  enqueueOrderNotification,
} from "@/services/notifications/events"
import { scheduleNotificationDelivery } from "@/services/notifications/outbox"
import { getOrCreateCart } from "@/services/storefront/cart"
import { evaluatePromotion } from "@/services/storefront/promotions"
import {
  calculateDeliveryFee,
  calculateTax,
  parseCheckoutConfig,
} from "@/services/storefront/settings"

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  email: z.email(),
  phone: z.string().trim().min(9).max(20),
  alternatePhone: z.string().trim().max(20).optional(),
  deliveryRegion: z.string().trim().min(2).max(80),
  deliveryCityTown: z.string().trim().min(2).max(100),
  deliveryAreaSuburb: z.string().trim().max(100).optional(),
  deliveryGhanaPostGps: z.string().trim().max(30).optional(),
  deliveryStreetAddress: z.string().trim().min(3).max(250),
  deliveryNearbyLandmark: z.string().trim().max(250).optional(),
  deliveryInstructions: z.string().trim().max(500).optional(),
  deliveryMethodCode: z.string().trim().min(1),
  promotionCode: z.string().trim().optional(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

export async function calculateCheckout(
  request: Request,
  input: CheckoutInput
) {
  const [{ cart }, shopper] = await Promise.all([
    getOrCreateCart(request),
    resolveShopper(request),
  ])
  const settings = await prisma.storeSettings.findUnique({
    where: { key: "default" },
    select: { checkoutConfig: true },
  })
  const checkoutConfig = parseCheckoutConfig(settings?.checkoutConfig)
  if (!shopper.userId && !checkoutConfig.guestCheckout)
    throw new Error("Please sign in to continue to checkout")
  if (!cart.items.length) throw new Error("Your cart is empty")
  const delivery = await prisma.deliveryMethod.findFirst({
    where: { code: input.deliveryMethodCode, active: true, deletedAt: null },
  })
  if (
    !delivery ||
    (delivery.regions.length &&
      !delivery.regions.includes(input.deliveryRegion))
  )
    throw new Error("Delivery method is not available for this region")
  const subtotalPesewas = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.variant.pricePesewas,
    0
  )
  const promo = input.promotionCode
    ? await evaluatePromotion(
        input.promotionCode,
        subtotalPesewas,
        shopper.userId,
        input.email,
        cart.items.map((item) => ({
          productId: item.variant.product.id,
          categoryIds: item.variant.product.categories.map(
            (entry) => entry.categoryId
          ),
          lineTotalPesewas: item.quantity * item.variant.pricePesewas,
        }))
      )
    : undefined
  const discountPesewas = promo?.discountPesewas ?? 0
  const deliveryFeePesewas = calculateDeliveryFee(
    subtotalPesewas - discountPesewas,
    delivery.feePesewas,
    checkoutConfig.freeDeliveryThresholdPesewas,
    promo?.promotion.type === "FREE_DELIVERY"
  )
  const taxPesewas = calculateTax(
    subtotalPesewas,
    discountPesewas,
    checkoutConfig.taxRateBasisPoints
  )
  return {
    cart,
    shopper,
    delivery,
    promo,
    subtotalPesewas,
    discountPesewas,
    deliveryFeePesewas,
    taxPesewas,
    checkoutConfig,
    totalPesewas:
      subtotalPesewas - discountPesewas + taxPesewas + deliveryFeePesewas,
  }
}

export async function createOrder(request: Request, input: CheckoutInput) {
  const calculation = await calculateCheckout(request, input)
  const guestAccessToken = calculation.shopper.userId
    ? undefined
    : randomBytes(32).toString("base64url")
  const orderNumber = `TRD-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`
  const reservationExpiresAt = new Date(
    Date.now() + calculation.checkoutConfig.reservationMinutes * 60_000
  )
  const order = await prisma.$transaction(
    async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: calculation.shopper.userId,
          cartId: calculation.cart.id,
          promotionId: calculation.promo?.promotion.id,
          deliveryMethodId: calculation.delivery.id,
          customerName: input.customerName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          alternatePhone: input.alternatePhone,
          deliveryRegion: input.deliveryRegion,
          deliveryCityTown: input.deliveryCityTown,
          deliveryAreaSuburb: input.deliveryAreaSuburb,
          deliveryGhanaPostGps: input.deliveryGhanaPostGps,
          deliveryStreetAddress: input.deliveryStreetAddress,
          deliveryNearbyLandmark: input.deliveryNearbyLandmark,
          deliveryInstructions: input.deliveryInstructions,
          deliveryMethodCodeSnapshot: calculation.delivery.code,
          deliveryMethodNameSnapshot: calculation.delivery.name,
          subtotalPesewas: calculation.subtotalPesewas,
          discountPesewas: calculation.discountPesewas,
          deliveryFeePesewas: calculation.deliveryFeePesewas,
          taxPesewas: calculation.taxPesewas,
          totalPesewas: calculation.totalPesewas,
          promotionCodeSnapshot: calculation.promo?.promotion.code,
          guestAccessTokenHash: guestAccessToken
            ? hashShopperToken(guestAccessToken)
            : undefined,
          reservationExpiresAt,
          items: {
            create: calculation.cart.items.map((item) => ({
              productId: item.variant.product.id,
              variantId: item.variant.id,
              productNameSnapshot: item.variant.product.name,
              productSlugSnapshot: item.variant.product.slug,
              imageUrlSnapshot:
                item.variant.product.media[0]?.mediaAsset.secureUrl,
              skuSnapshot: item.variant.sku,
              sizeSnapshot: item.variant.sizeLabel,
              colorSnapshot: item.variant.colorName,
              unitPricePesewas: item.variant.pricePesewas,
              quantity: item.quantity,
              lineTotalPesewas: item.quantity * item.variant.pricePesewas,
            })),
          },
          events: {
            create: {
              type: OrderEventType.ORDER_PLACED,
              title: "Order placed",
            },
          },
        },
        include: { items: true },
      })
      await reserveInventory(
        tx,
        created.id,
        calculation.cart.items.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        }))
      )
      if (calculation.promo) {
        await tx.promotionRedemption.create({
          data: {
            promotionId: calculation.promo.promotion.id,
            orderId: created.id,
            userId: calculation.shopper.userId,
            guestEmail: calculation.shopper.userId
              ? undefined
              : input.email.toLowerCase(),
            discountPesewas: calculation.discountPesewas,
          },
        })
        await tx.promotion.update({
          where: { id: calculation.promo.promotion.id },
          data: { usedCount: { increment: 1 } },
        })
      }
      await enqueueOrderNotification(tx, {
        eventKey: `order:${created.id}:placed`,
        template: NotificationTemplate.ORDER_PLACED,
        order: created,
      })
      return created
    },
    { isolationLevel: "Serializable" }
  )
  scheduleNotificationDelivery([`order:${order.id}:placed`])
  return { order, guestAccessToken }
}
