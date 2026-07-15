import {
  NotificationTemplate,
  OrderEventType,
  OrderStatus,
} from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { releaseInventory } from "@/services/inventory/inventory"
import { enqueueOrderNotification } from "@/services/notifications/events"
import { scheduleNotificationDelivery } from "@/services/notifications/outbox"
import { reconcilePaystackPayment } from "@/services/payments/payment-workflow"

export async function releaseExpiredReservations(now = new Date()) {
  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING_PAYMENT,
      reservationExpiresAt: { lte: now },
    },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      customerName: true,
      email: true,
      phone: true,
      totalPesewas: true,
      currency: true,
    },
    take: 100,
  })
  let released = 0
  for (const order of orders) {
    const payments = await prisma.payment.findMany({
      where: {
        orderId: order.id,
        status: { in: ["INITIALIZED", "PENDING"] },
      },
      select: { reference: true },
    })
    let confirmed = false
    for (const payment of payments) {
      try {
        const result = await reconcilePaystackPayment(payment.reference)
        if (result.confirmed) {
          confirmed = true
          break
        }
      } catch (error) {
        console.error(
          `Final Paystack verification failed for ${payment.reference}`,
          error
        )
      }
    }
    if (confirmed) continue
    const changed = await prisma.$transaction(async (tx) => {
      const claim = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING_PAYMENT,
          reservationExpiresAt: { lte: now },
        },
        data: { status: OrderStatus.CANCELLED, cancelledAt: now },
      })
      if (!claim.count) return null
      await releaseInventory(tx, order.id)
      const event = await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: OrderEventType.CANCELLED,
          title: "Order expired",
          description: "The payment window expired and reserved stock was released.",
        },
      })
      await tx.payment.updateMany({
        where: { orderId: order.id, status: { in: ["INITIALIZED", "PENDING"] } },
        data: { status: "CANCELLED", failureMessage: "Payment window expired" },
      })
      const eventKey = `order-event:${event.id}`
      await enqueueOrderNotification(tx, {
        eventKey,
        template: NotificationTemplate.ORDER_STATUS_UPDATED,
        order,
        extra: {
          status: OrderStatus.CANCELLED,
          note: "The payment window expired and reserved stock was released.",
        },
      })
      return eventKey
    })
    if (changed) {
      released += 1
      scheduleNotificationDelivery([changed])
    }
  }
  return { examined: orders.length, released }
}
