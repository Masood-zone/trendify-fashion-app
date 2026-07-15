"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { toApiClientError } from "@/lib/api-client-error"
import type { ApiResponse } from "@/types"
import type { AdminDashboardData, AdminProductSummary } from "@/types/admin"

async function read<T>(path: string, fallback: string) {
  try {
    const response = await api.get<ApiResponse<T>>(path)
    if (!response.data.success || response.data.data === undefined)
      throw new Error(response.data.message)
    return response.data.data
  } catch (error) {
    throw toApiClientError(error, fallback)
  }
}
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () =>
      read<AdminDashboardData>(
        "/admin/dashboard",
        "Dashboard could not be loaded"
      ),
  })
}
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: () =>
      read<AdminProductSummary[]>(
        "/admin/products",
        "Products could not be loaded"
      ),
  })
}
