import { fail, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  publicProductInclude,
  publicProductWhere,
  publishedContentWhere,
} from "@/services/storefront/catalog"
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const collection = await prisma.collection.findFirst({
      where: { ...publishedContentWhere, slug: (await context.params).slug },
      include: {
        products: {
          include: { product: { include: publicProductInclude } },
          where: { product: publicProductWhere },
          orderBy: { sortOrder: "asc" },
        },
      },
    })
    return collection ? ok(collection) : fail("Collection not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
