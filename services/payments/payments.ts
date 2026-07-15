"use client"

import { useMutation } from "@tanstack/react-query"
import api from "@/lib/axios"
import { toApiClientError } from "@/lib/api-client-error"
import type { ApiResponse } from "@/types"
import type {
  PaystackInitialization,
  PaymentVerification,
} from "@/types/payments"

async function post<T>(path: string, input: unknown, fallback: string) {
  try {
    const response = await api.post<ApiResponse<T>>(path, input)
    if (!response.data.success || !response.data.data)
      throw new Error(response.data.message)
    return response.data.data
  } catch (error) {
    throw toApiClientError(error, fallback)
  }
}
export function useInitializePaystack() {
  return useMutation({
    mutationFn: (input: {
      orderId: string
      channel?: string
      mobileMoneyNetwork?: string
      payerPhone?: string
      payerName?: string
      guestAccessToken?: string
    }) =>
      post<PaystackInitialization>(
        "/payments/paystack/initialize",
        input,
        "Payment could not be initialized"
      ),
  })
}
export function useVerifyPaystack() {
  return useMutation({
    mutationFn: (input: { reference: string; guestAccessToken?: string }) =>
      post<PaymentVerification>(
        "/payments/paystack/verify",
        input,
        "Payment status could not be refreshed"
      ),
  })
}
