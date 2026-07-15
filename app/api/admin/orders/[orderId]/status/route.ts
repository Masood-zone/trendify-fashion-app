import { z } from "zod"
import { OrderEventType, OrderStatus } from "@/app/generated/prisma/enums"
import { requireAdmin } from "@/lib/admin-api"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
const schema = z.object({
  status: z.enum([
    "PROCESSING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  note: z.string().max(500).optional(),
})
const transitions: Record<string, string[]> = {
  CONFIRMED: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "REFUNDED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
}
export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).orderId
    const current = await prisma.order.findUnique({ where: { id } })
    if (!current) return fail("Order not found", 404)
    if (!transitions[current.status]?.includes(parsed.data.status))
      return fail(
        `Cannot move order from ${current.status} to ${parsed.data.status}`,
        409
      )
    const status = parsed.data.status as OrderStatus
    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          ...(status === OrderStatus.DELIVERED
            ? { deliveredAt: new Date() }
            : {}),
          ...(status === OrderStatus.CANCELLED
            ? { cancelledAt: new Date() }
            : {}),
        },
      })
      await tx.orderEvent.create({
        data: {
          orderId: id,
          actorId: guard.session.user.id,
          type: OrderEventType[status as keyof typeof OrderEventType],
          title: status.replaceAll("_", " "),
          description: parsed.data.note,
        },
      })
      return updated
    })
    await auditAdmin(guard.session.user.id, "order.status", "Order", id, {
      from: current.status,
      to: status,
    })
    return ok(order)
  } catch (error) {
    return serverError(error)
  }
}
