import { fail } from "@/lib/api-response"

type PrismaLikeError = {
  code?: unknown
  meta?: { target?: unknown }
}

export class ProductValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProductValidationError"
  }
}

export function productConflictResponse(error: unknown) {
  if (error instanceof ProductValidationError) {
    return fail(error.message, 422, "PRODUCT_VALIDATION")
  }
  const prismaError = error as PrismaLikeError
  if (prismaError?.code !== "P2002") return null

  const target = Array.isArray(prismaError.meta?.target)
    ? prismaError.meta.target.join(", ")
    : String(prismaError.meta?.target ?? "")
  const detail = target.toLowerCase().includes("slug")
    ? "slug"
    : target.toLowerCase().includes("sku")
      ? "SKU"
      : "slug, SKU, or media selection"

  return fail(
    `A product with this ${detail} already exists. Choose a different value and try again.`,
    409,
    "PRODUCT_CONFLICT"
  )
}
