import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
export async function GET(request: Request) {
  try {
    const region = new URL(request.url).searchParams.get("region")
    const methods = await prisma.deliveryMethod.findMany({
      where: {
        active: true,
        deletedAt: null,
        ...(region
          ? {
              OR: [
                { regions: { isEmpty: true } },
                { regions: { has: region } },
              ],
            }
          : {}),
      },
      orderBy: { sortOrder: "asc" },
    })
    return ok(methods)
  } catch (error) {
    return serverError(error)
  }
}
