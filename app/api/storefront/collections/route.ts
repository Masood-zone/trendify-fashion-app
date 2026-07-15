import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { publishedContentWhere } from "@/services/storefront/catalog"
export async function GET() {
  try {
    return ok(
      await prisma.collection.findMany({
        where: publishedContentWhere,
        orderBy: { sortOrder: "asc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
