import { fail, ok, serverError } from "@/lib/api-response"
import {
  getPublicProduct,
  serializeProductDetail,
} from "@/services/storefront/catalog"

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const product = await getPublicProduct((await context.params).slug)
    return product
      ? ok(serializeProductDetail(product))
      : fail("Product not found", 404, "NOT_FOUND")
  } catch (error) {
    return serverError(error)
  }
}
