import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
const schema = z.object({
  trackingNumber: z.string().trim().min(2).max(100),
  carrier: z.string().trim().min(2).max(100),
  estimatedDeliveryAt: z.coerce.date().optional(),
  location: z.string().max(150).optional(),
  description: z.string().max(500).optional(),
})
export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).orderId
    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          trackingNumber: parsed.data.trackingNumber,
          carrier: parsed.data.carrier,
          estimatedDeliveryAt: parsed.data.estimatedDeliveryAt,
        },
      })
      await tx.orderEvent.create({
        data: {
          orderId: id,
          actorId: guard.session.user.id,
          type: "NOTE",
          title: "Tracking updated",
          description: parsed.data.description,
          location: parsed.data.location,
        },
      })
      return updated
    })
    await auditAdmin(guard.session.user.id, "order.tracking", "Order", id)
    return ok(order)
  } catch (error) {
    return serverError(error)
  }
}
