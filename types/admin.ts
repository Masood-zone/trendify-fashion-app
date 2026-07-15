import type { ProductStatus } from "@/app/generated/prisma/enums"
import type { MoneyPesewas } from "@/types"

export interface AdminProductSummary {
  id: string
  name: string
  slug: string
  status: ProductStatus
  basePricePesewas: MoneyPesewas
  updatedAt: string
}

export interface AdminDashboardData {
  productCount: number
  customerCount: number
  pendingOrders: number
  lowStock: number
  revenuePesewas: MoneyPesewas
}
