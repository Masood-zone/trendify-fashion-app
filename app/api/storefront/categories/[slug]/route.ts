import { fail, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  publicProductInclude,
  publicProductWhere,
} from "@/services/storefront/catalog"
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const category = await prisma.category.findFirst({
      where: {
        slug: (await context.params).slug,
        active: true,
        deletedAt: null,
      },
      include: {
        products: {
          include: { product: { include: publicProductInclude } },
          where: { product: publicProductWhere },
          orderBy: { sortOrder: "asc" },
        },
      },
    })
    return category ? ok(category) : fail("Category not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
