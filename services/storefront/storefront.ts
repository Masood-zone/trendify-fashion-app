"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "@/lib/axios"
import { toApiClientError } from "@/lib/api-client-error"
import type { ApiResponse } from "@/types"
import type { CartData, ProductPage } from "@/types/storefront"

async function unwrap<T>(
  request: Promise<{ data: ApiResponse<T> }>,
  fallback: string
) {
  try {
    const { data } = await request
    if (!data.success || data.data === undefined) throw new Error(data.message)
    return data.data
  } catch (error) {
    throw toApiClientError(error, fallback)
  }
}

export function useProducts(params = "") {
  return useQuery({
    queryKey: ["storefront", "products", params],
    queryFn: () =>
      unwrap<ProductPage>(
        api.get(`/storefront/products${params}`),
        "Products could not be loaded"
      ),
  })
}
export function useCart() {
  return useQuery({
    queryKey: ["storefront", "cart"],
    queryFn: () =>
      unwrap<CartData>(api.get("/storefront/cart"), "Cart could not be loaded"),
  })
}
export function useAddCartItem() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { variantId: string; quantity: number }) =>
      unwrap<CartData>(
        api.post("/storefront/cart/items", input),
        "Item could not be added"
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["storefront", "cart"] }),
  })
}
