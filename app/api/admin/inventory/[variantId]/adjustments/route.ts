import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { fail, invalid, ok } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
const schema = z.object({
  quantityDelta: z.int().refine((v) => v !== 0),
  note: z.string().trim().min(2).max(500),
  reference: z.string().max(100).optional(),
})
export async function POST(
  request: Request,
  context: { params: Promise<{ variantId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).variantId
    const variant = await prisma.$transaction(
      async (tx) => {
        const current = await tx.productVariant.findUnique({ where: { id } })
        if (!current || current.deletedAt) throw new Error("Variant not found")
        const next = current.stockQuantity + parsed.data.quantityDelta
        if (next < current.reservedQuantity || next < 0)
          throw new Error(
            "Adjustment would reduce stock below reserved inventory"
          )
        const updated = await tx.productVariant.update({
          where: { id },
          data: { stockQuantity: next },
        })
        await tx.inventoryMovement.create({
          data: {
            variantId: id,
            actorId: guard.session.user.id,
            type: "ADJUSTMENT",
            quantityDelta: parsed.data.quantityDelta,
            quantityAfter: next,
            reservedAfter: current.reservedQuantity,
            note: parsed.data.note,
            reference: parsed.data.reference,
          },
        })
        return updated
      },
      { isolationLevel: "Serializable" }
    )
    await auditAdmin(
      guard.session.user.id,
      "inventory.adjust",
      "ProductVariant",
      id,
      parsed.data
    )
    return ok(variant)
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Inventory adjustment failed",
      409
    )
  }
}
