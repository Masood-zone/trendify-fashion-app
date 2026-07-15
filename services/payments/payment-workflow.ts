import {
  OrderEventType,
  OrderStatus,
  PaymentStatus,
  WebhookStatus,
} from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import {
  commitInventorySale,
  releaseInventory,
} from "@/services/inventory/inventory"

export async function recordSuccessfulPayment(
  webhookId: string,
  reference: string,
  amountPesewas: number,
  currency: string,
  providerTransactionId?: string,
  paidAt?: Date
) {
  return prisma.$transaction(
    async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({
        where: { reference },
        include: { order: true },
      })
      if (payment.status === PaymentStatus.SUCCESS) {
        await tx.paymentWebhookEvent.update({
          where: { id: webhookId },
          data: { status: WebhookStatus.IGNORED, processedAt: new Date() },
        })
        return payment.order
      }
      if (
        amountPesewas !== payment.amountPesewas ||
        payment.amountPesewas !== payment.order.totalPesewas ||
        currency !== payment.currency
      )
        throw new Error("Payment amount or currency does not match the order")
      if (payment.order.status !== OrderStatus.PENDING_PAYMENT) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            providerTransactionId,
            paidAt: paidAt ?? new Date(),
            verifiedAt: new Date(),
          },
        })
        await tx.paymentWebhookEvent.update({
          where: { id: webhookId },
          data: {
            paymentId: payment.id,
            status: WebhookStatus.IGNORED,
            processedAt: new Date(),
            errorMessage: "Order was already finalized",
          },
        })
        return payment.order
      }
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          providerTransactionId,
          paidAt: paidAt ?? new Date(),
          verifiedAt: new Date(),
        },
      })
      await commitInventorySale(tx, payment.orderId)
      const order = await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.CONFIRMED },
      })
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: OrderEventType.PAYMENT_CONFIRMED,
          title: "Payment confirmed",
        },
      })
      await tx.paymentWebhookEvent.update({
        where: { id: webhookId },
        data: {
          paymentId: payment.id,
          status: WebhookStatus.PROCESSED,
          processedAt: new Date(),
        },
      })
      return order
    },
    { isolationLevel: "Serializable" }
  )
}

export async function recordFailedPayment(
  webhookId: string,
  reference: string,
  message?: string
) {
  return prisma.$transaction(
    async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({
        where: { reference },
        include: { order: true },
      })
      if (payment.status === PaymentStatus.SUCCESS) return payment.order
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, failureMessage: message },
      })
      if (payment.order.status === OrderStatus.PENDING_PAYMENT) {
        await releaseInventory(tx, payment.orderId)
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
        })
        await tx.orderEvent.create({
          data: {
            orderId: payment.orderId,
            type: OrderEventType.CANCELLED,
            title: "Order cancelled after payment failure",
          },
        })
      }
      await tx.paymentWebhookEvent.update({
        where: { id: webhookId },
        data: {
          paymentId: payment.id,
          status: WebhookStatus.PROCESSED,
          processedAt: new Date(),
        },
      })
      return payment.order
    },
    { isolationLevel: "Serializable" }
  )
}
