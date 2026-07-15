import { OrderEventType, OrderStatus } from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { releaseInventory } from "@/services/inventory/inventory"

export async function releaseExpiredReservations(now = new Date()) {
  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING_PAYMENT,
      reservationExpiresAt: { lte: now },
    },
    select: { id: true },
    take: 100,
  })
  let released = 0
  for (const order of orders) {
    const changed = await prisma.$transaction(async (tx) => {
      const claim = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING_PAYMENT,
          reservationExpiresAt: { lte: now },
        },
        data: { status: OrderStatus.CANCELLED, cancelledAt: now },
      })
      if (!claim.count) return false
      await releaseInventory(tx, order.id)
      await tx.orderEvent.create({
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
      return true
    })
    if (changed) released += 1
  }
  return { examined: orders.length, released }
}
