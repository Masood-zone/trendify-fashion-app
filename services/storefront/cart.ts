import { CartStatus } from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import {
  GUEST_CART_COOKIE,
  hashShopperToken,
  newShopperToken,
  resolveShopper,
} from "@/lib/shopper-context"

export const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: {
        include: {
          product: {
            include: {
              brand: { select: { id: true, name: true, slug: true } },
              media: {
                include: { mediaAsset: true },
                orderBy: { sortOrder: "asc" as const },
                take: 1,
              },
              categories: true,
            },
          },
        },
      },
    },
  },
} as const

export function cartSummary<
  T extends {
    id: string
    items: Array<{
      id: string
      quantity: number
      variant: {
        id: string
        sku: string
        sizeLabel: string | null
        colorName: string | null
        colorHex: string | null
        pricePesewas: number
        compareAtPricePesewas: number | null
        active: boolean
        stockQuantity: number
        reservedQuantity: number
        product: {
          id: string
          name: string
          slug: string
          brand: { id: string; name: string; slug: string } | null
          media: Array<{
            primary: boolean
            altText: string | null
            mediaAsset: {
              id: string
              secureUrl: string
              altText: string | null
            }
          }>
        }
      }
    }>
  },
>(cart: T) {
  const subtotalPesewas = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.variant.pricePesewas,
    0
  )
  return {
    id: cart.id,
    subtotalPesewas,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    items: cart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      lineTotalPesewas: item.quantity * item.variant.pricePesewas,
      variant: {
        id: item.variant.id,
        sku: item.variant.sku,
        sizeLabel: item.variant.sizeLabel,
        colorName: item.variant.colorName,
        colorHex: item.variant.colorHex,
        pricePesewas: item.variant.pricePesewas,
        compareAtPricePesewas: item.variant.compareAtPricePesewas,
        availableQuantity: Math.max(
          0,
          item.variant.stockQuantity - item.variant.reservedQuantity
        ),
        active: item.variant.active,
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
          slug: item.variant.product.slug,
          brand: item.variant.product.brand,
          media: item.variant.product.media.map((entry) => ({
            id: entry.mediaAsset.id,
            url: entry.mediaAsset.secureUrl,
            altText:
              entry.altText ||
              entry.mediaAsset.altText ||
              `${item.variant.product.name} product image`,
            primary: entry.primary,
          })),
        },
      },
    })),
  }
}

export async function getOrCreateCart(request: Request) {
  const shopper = await resolveShopper(request)
  let guestToken = shopper.guestToken
  if (shopper.userId) {
    let cart = await prisma.cart.findFirst({
      where: { userId: shopper.userId, status: CartStatus.ACTIVE },
      include: cartInclude,
    })
    if (!cart) {
      cart = await prisma.cart
        .create({ data: { userId: shopper.userId }, include: cartInclude })
        .catch(async () =>
          prisma.cart.findFirstOrThrow({
            where: { userId: shopper.userId, status: CartStatus.ACTIVE },
            include: cartInclude,
          })
        )
    }
    const cartId = cart.id
    if (shopper.guestTokenHash) {
      const guestCart = await prisma.cart.findUnique({
        where: { guestTokenHash: shopper.guestTokenHash },
        include: { items: true },
      })
      if (guestCart?.status === CartStatus.ACTIVE && guestCart.id !== cartId) {
        await prisma.$transaction(async (tx) => {
          for (const item of guestCart.items) {
            const current = await tx.cartItem.findUnique({
              where: {
                cartId_variantId: {
                  cartId,
                  variantId: item.variantId,
                },
              },
            })
            const variant = await tx.productVariant.findUniqueOrThrow({
              where: { id: item.variantId },
            })
            const quantity = Math.min(
              Math.max(0, variant.stockQuantity - variant.reservedQuantity),
              (current?.quantity ?? 0) + item.quantity
            )
            if (quantity > 0)
              await tx.cartItem.upsert({
                where: {
                  cartId_variantId: {
                    cartId,
                    variantId: item.variantId,
                  },
                },
                create: {
                  cartId,
                  variantId: item.variantId,
                  quantity,
                },
                update: { quantity },
              })
          }
          await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } })
          await tx.cart.update({
            where: { id: guestCart.id },
            data: { status: CartStatus.CONVERTED },
          })
        })
        cart = await prisma.cart.findUniqueOrThrow({
          where: { id: cartId },
          include: cartInclude,
        })
      }
    }
    return { cart, guestToken: undefined }
  }
  if (!guestToken) guestToken = newShopperToken()
  const guestTokenHash = hashShopperToken(guestToken)
  const cart = await prisma.cart.upsert({
    where: { guestTokenHash },
    create: { guestTokenHash, expiresAt: new Date(Date.now() + 30 * 86400000) },
    update: { expiresAt: new Date(Date.now() + 30 * 86400000) },
    include: cartInclude,
  })
  return { cart, guestToken }
}

export function attachGuestCookie<T extends Response>(
  response: T,
  token?: string
) {
  if (token)
    response.headers.append(
      "Set-Cookie",
      `${GUEST_CART_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    )
  return response
}
