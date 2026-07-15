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
  summary: { revenuePesewas: MoneyPesewas; totalOrders: number; totalCustomers: number; productsInStock: number; pendingOrders: number; lowStockProducts: number }
  changes: { revenue: number; orders: number; customers: number }
  monthlyRevenue: Array<{ label: string; valuePesewas: MoneyPesewas }>
  orderStatus: { delivered: number; processing: number; refunded: number; pending: number; cancelled: number }
  salesByCategory: Array<{ name: string; valuePesewas: MoneyPesewas }>
  recentOrders: Array<{ id: string; orderNumber: string; customerName: string; createdAt: string; totalPesewas: MoneyPesewas; status: string; paid: boolean }>
  lowStock: Array<{ id: string; name: string; available: number; threshold: number; imageUrl: string | null }>
}
