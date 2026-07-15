import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { artisanSchema } from "@/services/admin/schemas"
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.artisan.findMany({
        where: { deletedAt: null },
        include: { _count: { select: { products: true } } },
        orderBy: { sortOrder: "asc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
export async function POST(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = artisanSchema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const item = await prisma.artisan.create({ data: parsed.data })
    await auditAdmin(
      guard.session.user.id,
      "artisan.create",
      "Artisan",
      item.id
    )
    return ok(item, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
