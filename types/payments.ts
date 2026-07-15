import type { OrderStatus, PaymentStatus } from "@/app/generated/prisma/enums"

export interface PaystackInitialization {
  reference: string
  authorizationUrl: string
  accessCode: string
  publicKey?: string
}

export interface PaymentVerification {
  reference: string
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  orderNumber: string
  providerStatus: string | null
  confirmed: boolean
}
