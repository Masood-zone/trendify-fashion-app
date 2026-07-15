import { z } from "zod"
import {
  NotificationTemplate,
  OrderEventType,
  OrderStatus,
} from "@/app/generated/prisma/enums"
import { requireAdmin } from "@/lib/admin-api"
import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { releaseInventory } from "@/services/inventory/inventory"
import { enqueueOrderNotification } from "@/services/notifications/events"
import { scheduleNotificationDelivery } from "@/services/notifications/outbox"
const schema = z.object({
  status: z.enum([
    "PROCESSING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z.string().max(500).optional(),
})
const transitions: Record<string, string[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
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
    const result = await prisma.$transaction(async (tx) => {
      if (
        status === OrderStatus.CANCELLED &&
        current.status === OrderStatus.PENDING_PAYMENT
      ) {
        await releaseInventory(tx, id)
      }
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
      const event = await tx.orderEvent.create({
        data: {
          orderId: id,
          actorId: guard.session.user.id,
          type: OrderEventType[status as keyof typeof OrderEventType],
          title: status.replaceAll("_", " "),
          description: parsed.data.note,
        },
      })
      const eventKey = `order-event:${event.id}`
      await enqueueOrderNotification(tx, {
        eventKey,
        template: NotificationTemplate.ORDER_STATUS_UPDATED,
        order: updated,
        extra: { status, note: parsed.data.note },
      })
      return { order: updated, eventKey }
    })
    await auditAdmin(guard.session.user.id, "order.status", "Order", id, {
      from: current.status,
      to: status,
    })
    scheduleNotificationDelivery([result.eventKey])
    return ok(result.order)
  } catch (error) {
    return serverError(error)
  }
}
