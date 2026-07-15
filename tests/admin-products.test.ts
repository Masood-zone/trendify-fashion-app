import assert from "node:assert/strict"
import test from "node:test"

import {
  ProductValidationError,
  productConflictResponse,
} from "../services/admin/product-errors"
import { appendProductMedia, removeProductMedia } from "../services/admin/product-media"
import { productPatchPayloadSchema } from "../services/admin/schemas"

const id = (suffix: string) => `cm0000000000000000000000${suffix}`

test("only the first image in the first appended batch becomes primary", () => {
  const appended = appendProductMedia([], [
    { mediaAssetId: id("01"), url: "https://example.test/one.jpg", altText: "One" },
    { mediaAssetId: id("02"), url: "https://example.test/two.jpg", altText: "Two" },
  ])
  assert.deepEqual(appended.map((item) => item.primary), [true, false])

  const next = appendProductMedia(appended, [
    { mediaAssetId: id("03"), url: "https://example.test/three.jpg", altText: "Three" },
  ])
  assert.deepEqual(next.map((item) => item.primary), [true, false, false])
})

test("removing the primary image promotes the first remaining image", () => {
  const media = [
    { mediaAssetId: id("01"), url: "one", altText: "One", primary: true },
    { mediaAssetId: id("02"), url: "two", altText: "Two", primary: false },
    { mediaAssetId: id("03"), url: "three", altText: "Three", primary: false },
  ]
  assert.deepEqual(removeProductMedia(media, 0).map((item) => item.primary), [true, false])
  assert.deepEqual(removeProductMedia(media, 2).map((item) => item.primary), [true, false])
})

test("product payload rejects multiple primaries and duplicate relations", () => {
  const result = productPatchPayloadSchema.safeParse({
    categoryIds: [id("01"), id("01")],
    collectionIds: [id("02"), id("02")],
    tags: [{ name: "Craft", slug: "craft" }, { name: "Craft", slug: "craft" }],
    media: [
      { mediaAssetId: id("03"), primary: true },
      { mediaAssetId: id("03"), primary: true },
    ],
    recommendations: [
      { recommendedProductId: id("04"), type: "SIMILAR" },
      { recommendedProductId: id("04"), type: "SIMILAR" },
    ],
    variants: [
      { sku: "SAME", sizeLabel: "M", colorName: "Clay", pricePesewas: 100 },
      { sku: "same", sizeLabel: "m", colorName: "clay", pricePesewas: 100 },
    ],
  })
  assert.equal(result.success, false)
  if (!result.success) {
    const messages = result.error.issues.map((issue) => issue.message)
    assert.ok(messages.includes("Only one product image can be primary"))
    assert.ok(messages.includes("Each media asset can only be attached once"))
    assert.ok(messages.includes("Each category can only be selected once"))
    assert.ok(messages.includes("Each collection can only be selected once"))
    assert.ok(messages.includes("Each tag can only be selected once"))
    assert.ok(messages.includes("Each recommendation and type can only be selected once"))
    assert.ok(messages.includes("Each SKU must be unique"))
    assert.ok(messages.includes("Each size and colour combination must be unique"))
  }
})

test("P2002 maps to an actionable product conflict response", async () => {
  const response = productConflictResponse({ code: "P2002", meta: { target: ["slug"] } })
  assert.ok(response)
  assert.equal(response.status, 409)
  assert.deepEqual(await response.json(), {
    success: false,
    message: "A product with this slug already exists. Choose a different value and try again.",
    code: "PRODUCT_CONFLICT",
  })
  assert.equal(productConflictResponse(new Error("other")), null)
})

test("product publishing validation maps to 422", async () => {
  const response = productConflictResponse(
    new ProductValidationError("Publishing requires: primary image")
  )
  assert.ok(response)
  assert.equal(response.status, 422)
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Publishing requires: primary image",
    code: "PRODUCT_VALIDATION",
  })
})
