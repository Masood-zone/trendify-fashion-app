import {
  InventoryMovementType,
  type PrismaClient,
} from "@/app/generated/prisma/client"

type Transaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]

type ReservationLine = { variantId: string; quantity: number }

export async function reserveInventory(
  tx: Transaction,
  orderId: string,
  lines: ReservationLine[]
) {
  for (const line of lines) {
    const rows = await tx.$queryRaw<
      Array<{ stockQuantity: number; reservedQuantity: number }>
    >`
      UPDATE "ProductVariant"
      SET "reservedQuantity" = "reservedQuantity" + ${line.quantity}, "updatedAt" = NOW()
      WHERE id = ${line.variantId} AND active = true AND "deletedAt" IS NULL
        AND "stockQuantity" - "reservedQuantity" >= ${line.quantity}
      RETURNING "stockQuantity", "reservedQuantity"`
    if (!rows[0]) throw new Error("An item no longer has enough stock")
    await tx.inventoryMovement.create({
      data: {
        variantId: line.variantId,
        orderId,
        type: InventoryMovementType.RESERVATION,
        quantityDelta: line.quantity,
        quantityAfter: rows[0].stockQuantity,
        reservedAfter: rows[0].reservedQuantity,
      },
    })
  }
}

export async function commitInventorySale(tx: Transaction, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  })
  for (const item of order.items) {
    if (!item.variantId) continue
    const variant = await tx.productVariant.update({
      where: { id: item.variantId },
      data: {
        stockQuantity: { decrement: item.quantity },
        reservedQuantity: { decrement: item.quantity },
      },
    })
    await tx.inventoryMovement.create({
      data: {
        variantId: item.variantId,
        orderId,
        type: InventoryMovementType.SALE,
        quantityDelta: -item.quantity,
        quantityAfter: variant.stockQuantity,
        reservedAfter: variant.reservedQuantity,
      },
    })
  }
}

export async function releaseInventory(tx: Transaction, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  })
  for (const item of order.items) {
    if (!item.variantId) continue
    const variant = await tx.productVariant.update({
      where: { id: item.variantId },
      data: { reservedQuantity: { decrement: item.quantity } },
    })
    await tx.inventoryMovement.create({
      data: {
        variantId: item.variantId,
        orderId,
        type: InventoryMovementType.RELEASE,
        quantityDelta: -item.quantity,
        quantityAfter: variant.stockQuantity,
        reservedAfter: variant.reservedQuantity,
      },
    })
  }
}
