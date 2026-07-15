import { z } from "zod"

import type { CheckoutConfig } from "@/types/storefront"

export const checkoutConfigSchema = z.object({
  guestCheckout: z.boolean().default(true),
  reservationMinutes: z.number().int().min(5).max(180).default(30),
  taxRateBasisPoints: z.number().int().min(0).max(10_000).default(0),
  freeDeliveryThresholdPesewas: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .default(null),
  country: z.literal("GH").default("GH"),
  currency: z.literal("GHS").default("GHS"),
})

export function parseCheckoutConfig(value: unknown): CheckoutConfig {
  const parsed = checkoutConfigSchema.safeParse(value)
  return parsed.success ? parsed.data : checkoutConfigSchema.parse({})
}

export function calculateTax(
  subtotalPesewas: number,
  discountPesewas: number,
  taxRateBasisPoints: number
) {
  const taxablePesewas = Math.max(0, subtotalPesewas - discountPesewas)
  return Math.round((taxablePesewas * taxRateBasisPoints) / 10_000)
}

export function calculateDeliveryFee(
  merchandiseAfterDiscountPesewas: number,
  configuredFeePesewas: number,
  freeDeliveryThresholdPesewas: number | null,
  promotionGrantsFreeDelivery = false
) {
  if (promotionGrantsFreeDelivery) return 0
  if (
    freeDeliveryThresholdPesewas !== null &&
    merchandiseAfterDiscountPesewas >= freeDeliveryThresholdPesewas
  ) {
    return 0
  }
  return configuredFeePesewas
}
