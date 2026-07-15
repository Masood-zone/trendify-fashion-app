import axios from "axios"

export function toApiClientError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return new Error(error.response?.data?.message || fallback)
  }
  return error instanceof Error ? error : new Error(fallback)
}
