import type { OrderStatus, PaymentStatus } from "@/app/generated/prisma/enums"
import type { MoneyPesewas, Paginated } from "@/types"

export type OrderLineData = {
  id: string
  productName: string
  productSlug: string
  imageUrl: string | null
  sku: string
  size: string | null
  color: string | null
  unitPricePesewas: MoneyPesewas
  quantity: number
  lineTotalPesewas: MoneyPesewas
  reviewId?: string | null
}

export type OrderEventData = {
  id: string
  type: string
  title: string
  description: string | null
  location: string | null
  occurredAt: string
}

export interface CustomerOrderSummary {
  id: string
  orderNumber: string
  status: OrderStatus
  totalPesewas: MoneyPesewas
  currency: string
  createdAt: string
  items: OrderLineData[]
  paymentStatus: PaymentStatus | null
}

export type CustomerOrderPage = Paginated<CustomerOrderSummary>

export type CustomerOrderDetail = CustomerOrderSummary & {
  customerName: string
  email: string
  phone: string
  deliveryAddress: string[]
  deliveryMethodName: string
  subtotalPesewas: number
  discountPesewas: number
  taxPesewas: number
  deliveryFeePesewas: number
  trackingNumber: string | null
  carrier: string | null
  estimatedDeliveryAt: string | null
  events: OrderEventData[]
}

export type CustomerDashboardData = {
  recentOrders: CustomerOrderSummary[]
  orderCount: number
  wishlistCount: number
  defaultAddress: CustomerAddressData | null
}

export type CustomerAddressData = {
  id: string
  label: string | null
  recipientName: string
  phone: string
  alternatePhone: string | null
  region: string
  cityTown: string
  areaSuburb: string | null
  ghanaPostGps: string | null
  streetAddress: string
  nearbyLandmark: string | null
  deliveryInstructions: string | null
  isDefault: boolean
}

export type CustomerProfileData = {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  email: string
  emailVerified: boolean
  phoneNumber: string | null
  phoneNumberVerified: boolean
  image: string | null
  createdAt: string
}
