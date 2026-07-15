"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { toApiClientError } from "@/lib/api-client-error"
import type { ApiResponse } from "@/types"

export async function getAdminResource<T>(path: string) {
  try {
    const response = await api.get<ApiResponse<T>>(path)
    if (!response.data.success || response.data.data === undefined)
      throw new Error(response.data.message)
    return response.data.data
  } catch (error) {
    throw toApiClientError(
      error,
      "The administrator resource could not be loaded"
    )
  }
}

export function useAdminResource<T>(
  key: readonly unknown[],
  path: string,
  enabled = true
) {
  return useQuery({
    queryKey: ["admin", ...key],
    queryFn: () => getAdminResource<T>(path),
    enabled,
  })
}

export function useAdminMutation<TPayload = unknown, TResult = unknown>({
  method,
  path,
  invalidate,
}: {
  method: "post" | "patch" | "delete"
  path: string | ((payload: TPayload) => string)
  invalidate: readonly unknown[][]
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TPayload) => {
      const url = typeof path === "function" ? path(payload) : path
      try {
        const response = await api.request<ApiResponse<TResult>>({
          method,
          url,
          data: payload,
        })
        if (!response.data.success) throw new Error(response.data.message)
        return response.data.data as TResult
      } catch (error) {
        throw toApiClientError(error, "The change could not be saved")
      }
    },
    onSuccess: async () => {
      await Promise.all(
        invalidate.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey: ["admin", ...queryKey] })
        )
      )
    },
  })
}
