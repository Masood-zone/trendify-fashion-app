import { fail, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { publishedContentWhere } from "@/services/storefront/catalog"
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const page = await prisma.contentPage.findFirst({
      where: { ...publishedContentWhere, slug: (await context.params).slug },
      include: { mediaAsset: true },
    })
    return page ? ok(page) : fail("Content not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
