import assert from "node:assert/strict"
import test from "node:test"

import { normalizeGhanaPhone, safeInternalPath } from "../lib/safe-redirect"
import {
  calculateDeliveryFee,
  calculateTax,
  parseCheckoutConfig,
} from "../services/storefront/settings"

test("tax is rounded from discounted merchandise and excludes delivery", () => {
  assert.equal(calculateTax(10_005, 0, 1_500), 1_501)
  assert.equal(calculateTax(100_000, 20_000, 1_500), 12_000)
  assert.equal(calculateTax(10_000, 15_000, 1_500), 0)
})

test("delivery threshold applies after merchandise discounts", () => {
  assert.equal(calculateDeliveryFee(49_999, 2_500, 50_000), 2_500)
  assert.equal(calculateDeliveryFee(50_000, 2_500, 50_000), 0)
  assert.equal(calculateDeliveryFee(10_000, 2_500, null, true), 0)
})

test("checkout settings use safe Ghana and GHS defaults", () => {
  assert.deepEqual(parseCheckoutConfig(undefined), {
    guestCheckout: true,
    reservationMinutes: 30,
    taxRateBasisPoints: 0,
    freeDeliveryThresholdPesewas: null,
    country: "GH",
    currency: "GHS",
  })
  assert.equal(
    parseCheckoutConfig({ reservationMinutes: 4 }).reservationMinutes,
    30
  )
})

test("authentication callbacks stay inside the application", () => {
  assert.equal(
    safeInternalPath("/checkout/review?from=login", "/account"),
    "/checkout/review?from=login"
  )
  assert.equal(safeInternalPath("//attacker.example", "/account"), "/account")
  assert.equal(
    safeInternalPath("https://attacker.example", "/account"),
    "/account"
  )
})

test("Ghana phone numbers are normalized for phone login", () => {
  assert.equal(normalizeGhanaPhone("024 123 4567"), "+233241234567")
  assert.equal(normalizeGhanaPhone("+233 24 123 4567"), "+233241234567")
})
