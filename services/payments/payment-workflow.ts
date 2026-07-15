import {
  OrderEventType,
  OrderStatus,
  PaymentStatus,
} from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { verifyPaystackTransaction } from "@/lib/paystack/paystack"
import {
  commitInventorySale,
  releaseInventory,
} from "@/services/inventory/inventory"

const pendingProviderStatuses = new Set([
  "pending",
  "ongoing",
  "processing",
  "queued",
])

function assertVerifiedPayment(
  local: { reference: string; amountPesewas: number; currency: string },
  provider: { reference: string; amount: number; currency: string }
) {
  if (provider.reference !== local.reference) {
    throw new Error("Paystack returned a different transaction reference")
  }
  if (provider.amount !== local.amountPesewas) {
    throw new Error("Paystack amount does not match the payment attempt")
  }
  if (provider.currency.toUpperCase() !== local.currency.toUpperCase()) {
    throw new Error("Paystack currency does not match the payment attempt")
  }
}

export async function reconcilePaystackPayment(reference: string) {
  const local = await prisma.payment.findUnique({
    where: { reference },
    include: { order: true },
  })
  if (!local) throw new Error("Payment attempt was not found")

  let provider
  try {
    provider = await verifyPaystackTransaction(reference)
  } catch (error) {
    await prisma.payment.update({
      where: { id: local.id },
      data: {
        lastCheckedAt: new Date(),
        verificationAttempts: { increment: 1 },
      },
    })
    throw error
  }

  assertVerifiedPayment(local, provider)
  const providerStatus = provider.status.toLowerCase()
  const checkedAt = new Date()

  if (providerStatus === "success") {
    return prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUniqueOrThrow({
          where: { reference },
          include: { order: true },
        })
        if (payment.status === PaymentStatus.SUCCESS) {
          return {
            payment,
            order: payment.order,
            providerStatus,
            confirmed: true,
          }
        }

        const paymentData = {
          status: PaymentStatus.SUCCESS,
          providerStatus,
          gatewayResponse: provider.gateway_response,
          providerTransactionId: provider.id ? String(provider.id) : undefined,
          paidAt: provider.paid_at ? new Date(provider.paid_at) : checkedAt,
          verifiedAt: checkedAt,
          lastCheckedAt: checkedAt,
          verificationAttempts: { increment: 1 },
          failureCode: null,
          failureMessage: null,
        } as const

        if (payment.order.status !== OrderStatus.PENDING_PAYMENT) {
          const updatedPayment = await tx.payment.update({
            where: { id: payment.id },
            data: paymentData,
          })
          await tx.orderEvent.create({
            data: {
              orderId: payment.orderId,
              type: OrderEventType.NOTE,
              title: "Late payment verified",
              description:
                "Paystack confirmed payment after the order had already left the pending-payment state. Administrator review is required.",
            },
          })
          return {
            payment: updatedPayment,
            order: payment.order,
            providerStatus,
            confirmed: false,
          }
        }

        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: paymentData,
        })
        await commitInventorySale(tx, payment.orderId)
        const order = await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.CONFIRMED },
        })
        if (order.cartId) {
          await tx.cart.updateMany({
            where: { id: order.cartId, status: "ACTIVE" },
            data: { status: "CONVERTED" },
          })
        }
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            type: OrderEventType.PAYMENT_CONFIRMED,
            title: "Payment confirmed by Paystack",
          },
        })
        return {
          payment: updatedPayment,
          order,
          providerStatus,
          confirmed: true,
        }
      },
      { isolationLevel: "Serializable" }
    )
  }

  if (providerStatus === "failed" || providerStatus === "reversed") {
    return prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.update({
          where: { id: local.id },
          data: {
            status: PaymentStatus.FAILED,
            providerStatus,
            gatewayResponse: provider.gateway_response,
            failureCode: providerStatus.toUpperCase(),
            failureMessage:
              provider.gateway_response ||
              `Paystack reported ${providerStatus}`,
            lastCheckedAt: checkedAt,
            verificationAttempts: { increment: 1 },
          },
        })
        let order = local.order
        if (local.order.status === OrderStatus.PENDING_PAYMENT) {
          const viableAttempts = await tx.payment.count({
            where: {
              orderId: local.orderId,
              id: { not: local.id },
              status: {
                in: [PaymentStatus.INITIALIZED, PaymentStatus.PENDING],
              },
            },
          })
          if (viableAttempts === 0) {
            await releaseInventory(tx, local.orderId)
            order = await tx.order.update({
              where: { id: local.orderId },
              data: { status: OrderStatus.CANCELLED, cancelledAt: checkedAt },
            })
            await tx.orderEvent.create({
              data: {
                orderId: local.orderId,
                type: OrderEventType.CANCELLED,
                title: "Order cancelled after payment failure",
              },
            })
          }
        }
        return { payment, order, providerStatus, confirmed: false }
      },
      { isolationLevel: "Serializable" }
    )
  }

  const payment = await prisma.payment.update({
    where: { id: local.id },
    data: {
      status:
        providerStatus === "abandoned"
          ? PaymentStatus.FAILED
          : pendingProviderStatuses.has(providerStatus)
            ? PaymentStatus.PENDING
            : local.status,
      providerStatus,
      gatewayResponse: provider.gateway_response,
      failureCode: providerStatus === "abandoned" ? "ABANDONED" : undefined,
      failureMessage:
        providerStatus === "abandoned"
          ? provider.gateway_response || "Payment was abandoned"
          : undefined,
      lastCheckedAt: checkedAt,
      verificationAttempts: { increment: 1 },
    },
  })
  return { payment, order: local.order, providerStatus, confirmed: false }
}

export async function reconcilePendingPaystackPayments(limit = 100) {
  const pending = await prisma.payment.findMany({
    where: {
      status: { in: [PaymentStatus.INITIALIZED, PaymentStatus.PENDING] },
      provider: "PAYSTACK",
    },
    orderBy: [{ lastCheckedAt: "asc" }, { createdAt: "asc" }],
    take: limit,
    select: { reference: true },
  })
  const results = {
    examined: pending.length,
    confirmed: 0,
    pending: 0,
    failed: 0,
  }
  for (const item of pending) {
    try {
      const result = await reconcilePaystackPayment(item.reference)
      if (result.confirmed) results.confirmed += 1
      else if (result.payment.status === PaymentStatus.FAILED)
        results.failed += 1
      else results.pending += 1
    } catch (error) {
      console.error(
        `Paystack reconciliation failed for ${item.reference}`,
        error
      )
      results.pending += 1
    }
  }
  return results
}
