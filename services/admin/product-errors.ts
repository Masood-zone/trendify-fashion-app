import { fail } from "@/lib/api-response"

type PrismaLikeError = {
  code?: unknown
  meta?: { target?: unknown }
}

export function productConflictResponse(error: unknown) {
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
