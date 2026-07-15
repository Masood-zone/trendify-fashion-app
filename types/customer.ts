import type { OrderStatus } from "@/app/generated/prisma/enums"
import type { MoneyPesewas, Paginated } from "@/types"

export interface CustomerOrderSummary {
  id: string
  orderNumber: string
  status: OrderStatus
  totalPesewas: MoneyPesewas
  createdAt: string
  items: unknown[]
}

export type CustomerOrderPage = Paginated<CustomerOrderSummary>
