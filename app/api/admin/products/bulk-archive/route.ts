import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
const schema = z.object({ productIds: z.array(z.cuid()).min(1) })
export async function POST(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const result = await prisma.product.updateMany({
      where: { id: { in: parsed.data.productIds }, deletedAt: null },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    })
    await auditAdmin(
      guard.session.user.id,
      "product.bulk-archive",
      "Product",
      undefined,
      { productIds: parsed.data.productIds }
    )
    return ok({ archived: result.count })
  } catch (error) {
    return serverError(error)
  }
}
