"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import api from "@/lib/axios"
import { toApiClientError } from "@/lib/api-client-error"
import type { ApiResponse } from "@/types"
import type {
  CartData,
  CategorySummary,
  CheckoutInput,
  CheckoutQuote,
  CollectionSummary,
  DeliveryMethodData,
  HomepageData,
  OrderCreated,
  ProductDetail,
  ProductPage,
} from "@/types/storefront"

export async function storefrontRequest<T>(
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

export function useHome() {
  return useQuery({
    queryKey: ["storefront", "home"],
    queryFn: () =>
      storefrontRequest<HomepageData>(
        api.get("/storefront/home"),
        "The storefront could not be loaded"
      ),
  })
}

export function useProducts(params = "") {
  return useQuery({
    queryKey: ["storefront", "products", params],
    queryFn: () =>
      storefrontRequest<ProductPage>(
        api.get(`/storefront/products${params}`),
        "Products could not be loaded"
      ),
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["storefront", "product", slug],
    queryFn: () =>
      storefrontRequest<ProductDetail>(
        api.get(`/storefront/products/${encodeURIComponent(slug)}`),
        "Product could not be loaded"
      ),
    enabled: Boolean(slug),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ["storefront", "categories"],
    queryFn: () =>
      storefrontRequest<CategorySummary[]>(
        api.get("/storefront/categories"),
        "Categories could not be loaded"
      ),
  })
}

export function useCollections() {
  return useQuery({
    queryKey: ["storefront", "collections"],
    queryFn: () =>
      storefrontRequest<CollectionSummary[]>(
        api.get("/storefront/collections"),
        "Collections could not be loaded"
      ),
  })
}

export function useCart() {
  return useQuery({
    queryKey: ["storefront", "cart"],
    queryFn: () =>
      storefrontRequest<CartData>(
        api.get("/storefront/cart"),
        "Cart could not be loaded"
      ),
  })
}

function useCartMutation<T>(request: (input: T) => Promise<{ data: ApiResponse<CartData> }>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: T) => storefrontRequest(request(input), "Cart could not be updated"),
    onSuccess: (cart) => client.setQueryData(["storefront", "cart"], cart),
  })
}

export function useAddCartItem() {
  return useCartMutation<{ variantId: string; quantity: number }>((input) =>
    api.post("/storefront/cart/items", input)
  )
}

export function useUpdateCartItem() {
  return useCartMutation<{ itemId: string; quantity: number }>((input) =>
    api.patch(`/storefront/cart/items/${input.itemId}`, { quantity: input.quantity })
  )
}

export function useRemoveCartItem() {
  return useCartMutation<string>((itemId) =>
    api.delete(`/storefront/cart/items/${itemId}`)
  )
}

export function useClearCart() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () =>
      storefrontRequest<{ cleared: boolean }>(api.delete("/storefront/cart"), "Cart could not be cleared"),
    onSuccess: () => client.invalidateQueries({ queryKey: ["storefront", "cart"] }),
  })
}

export function useDeliveryMethods(region?: string) {
  return useQuery({
    queryKey: ["storefront", "delivery-methods", region],
    queryFn: () =>
      storefrontRequest<DeliveryMethodData[]>(
        api.get(`/storefront/delivery-methods${region ? `?region=${encodeURIComponent(region)}` : ""}`),
        "Delivery methods could not be loaded"
      ),
  })
}

export function useValidateCheckout() {
  return useMutation({
    mutationFn: (input: CheckoutInput) =>
      storefrontRequest<CheckoutQuote>(api.post("/storefront/checkout/validate", input), "Checkout could not be validated"),
  })
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (input: CheckoutInput) =>
      storefrontRequest<OrderCreated>(api.post("/storefront/checkout/order", input), "Order could not be created"),
  })
}
