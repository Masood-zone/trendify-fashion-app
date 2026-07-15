import type { CheckoutInput, CheckoutQuote, OrderCreated } from "@/types/storefront"

export type CheckoutSession = {
  input: Partial<CheckoutInput>
  quote?: CheckoutQuote
  order?: OrderCreated
  paymentReference?: string
}

const KEY = "trendify_checkout_session"

export function readCheckoutSession(): CheckoutSession {
  if (typeof window === "undefined") return { input: {} }
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{\"input\":{}}") as CheckoutSession
  } catch {
    return { input: {} }
  }
}

export function writeCheckoutSession(update: Partial<CheckoutSession>) {
  if (typeof window === "undefined") return
  const current = readCheckoutSession()
  sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...update }))
}

export function clearCheckoutSession() {
  if (typeof window !== "undefined") sessionStorage.removeItem(KEY)
}

export const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const
