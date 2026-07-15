"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { toApiClientError } from "@/lib/api-client-error"
import type { ApiResponse } from "@/types"
import type { CustomerOrderPage } from "@/types/customer"

async function getOrders() {
  try {
    const response =
      await api.get<ApiResponse<CustomerOrderPage>>("/customer/orders")
    if (!response.data.success || !response.data.data)
      throw new Error(response.data.message)
    return response.data.data
  } catch (error) {
    throw toApiClientError(error, "Orders could not be loaded")
  }
}
export function useCustomerOrders() {
  return useQuery({ queryKey: ["customer", "orders"], queryFn: getOrders })
}
