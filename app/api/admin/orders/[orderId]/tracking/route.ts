import { z } from "zod"
import { NotificationTemplate } from "@/app/generated/prisma/enums"
import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { enqueueOrderNotification } from "@/services/notifications/events"
import { scheduleNotificationDelivery } from "@/services/notifications/outbox"
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
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          trackingNumber: parsed.data.trackingNumber,
          carrier: parsed.data.carrier,
          estimatedDeliveryAt: parsed.data.estimatedDeliveryAt,
        },
      })
      const event = await tx.orderEvent.create({
        data: {
          orderId: id,
          actorId: guard.session.user.id,
          type: "NOTE",
          title: "Tracking updated",
          description: parsed.data.description,
          location: parsed.data.location,
        },
      })
      const eventKey = `order-event:${event.id}`
      await enqueueOrderNotification(tx, {
        eventKey,
        template: NotificationTemplate.TRACKING_UPDATED,
        order: updated,
        extra: {
          trackingNumber: parsed.data.trackingNumber,
          carrier: parsed.data.carrier,
          estimatedDeliveryAt: parsed.data.estimatedDeliveryAt?.toISOString(),
          note: parsed.data.description,
        },
      })
      return { order: updated, eventKey }
    })
    await auditAdmin(guard.session.user.id, "order.tracking", "Order", id)
    scheduleNotificationDelivery([result.eventKey])
    return ok(result.order)
  } catch (error) {
    return serverError(error)
  }
}
