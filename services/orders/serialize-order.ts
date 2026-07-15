import type { OrderStatus, PaymentStatus } from "@/app/generated/prisma/enums"

type ItemRecord = {
  id: string
  productNameSnapshot: string
  productSlugSnapshot: string
  imageUrlSnapshot: string | null
  skuSnapshot: string
  sizeSnapshot: string | null
  colorSnapshot: string | null
  unitPricePesewas: number
  quantity: number
  lineTotalPesewas: number
  review?: { id: string } | null
}

type EventRecord = {
  id: string
  type: string
  title: string
  description: string | null
  location: string | null
  occurredAt: Date
}

type SummaryRecord = {
  id: string
  orderNumber: string
  status: OrderStatus
  totalPesewas: number
  currency: string
  createdAt: Date
  items: ItemRecord[]
  payments: Array<{ status: PaymentStatus }>
}

export function serializeOrderItems(items: ItemRecord[]) {
  return items.map((item) => ({
    id: item.id,
    productName: item.productNameSnapshot,
    productSlug: item.productSlugSnapshot,
    imageUrl: item.imageUrlSnapshot,
    sku: item.skuSnapshot,
    size: item.sizeSnapshot,
    color: item.colorSnapshot,
    unitPricePesewas: item.unitPricePesewas,
    quantity: item.quantity,
    lineTotalPesewas: item.lineTotalPesewas,
    reviewId: item.review?.id ?? null,
  }))
}

export function serializeOrderSummary(order: SummaryRecord) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalPesewas: order.totalPesewas,
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    items: serializeOrderItems(order.items),
    paymentStatus: order.payments[0]?.status ?? null,
  }
}

export function serializeOrderDetail(
  order: SummaryRecord & {
    customerName: string
    email: string
    phone: string
    deliveryRegion: string
    deliveryCityTown: string
    deliveryAreaSuburb: string | null
    deliveryGhanaPostGps: string | null
    deliveryStreetAddress: string
    deliveryNearbyLandmark: string | null
    deliveryMethodNameSnapshot: string
    subtotalPesewas: number
    discountPesewas: number
    taxPesewas: number
    deliveryFeePesewas: number
    trackingNumber: string | null
    carrier: string | null
    estimatedDeliveryAt: Date | null
    events: EventRecord[]
  }
) {
  return {
    ...serializeOrderSummary(order),
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    deliveryAddress: [
      order.deliveryStreetAddress,
      order.deliveryAreaSuburb,
      order.deliveryCityTown,
      order.deliveryRegion,
      order.deliveryGhanaPostGps,
      order.deliveryNearbyLandmark,
    ].filter((value): value is string => Boolean(value)),
    deliveryMethodName: order.deliveryMethodNameSnapshot,
    subtotalPesewas: order.subtotalPesewas,
    discountPesewas: order.discountPesewas,
    taxPesewas: order.taxPesewas,
    deliveryFeePesewas: order.deliveryFeePesewas,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    estimatedDeliveryAt: order.estimatedDeliveryAt?.toISOString() ?? null,
    events: order.events.map((event) => ({
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      location: event.location,
      occurredAt: event.occurredAt.toISOString(),
    })),
  }
}
