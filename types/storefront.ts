import type { MoneyPesewas, Paginated } from "@/types"

export interface ProductListItem {
  id: string
  name: string
  slug: string
  basePricePesewas: MoneyPesewas
  featured: boolean
  newArrival: boolean
}

export type ProductPage = Paginated<ProductListItem>

export interface CartData {
  id: string
  itemCount: number
  subtotalPesewas: MoneyPesewas
  items: unknown[]
}
