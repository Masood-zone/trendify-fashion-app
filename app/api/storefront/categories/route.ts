import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
export async function GET() {
  try {
    return ok(
      await prisma.category.findMany({
        where: { active: true, deletedAt: null },
        include: { children: { where: { active: true, deletedAt: null } } },
        orderBy: { sortOrder: "asc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
