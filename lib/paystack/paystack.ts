const PAYSTACK_BASE_URL = "https://api.paystack.co"

type PaystackResponse<T> = {
  data?: T
  message: string
  status: boolean
}

export type PaystackInitializeInput = {
  amount: number
  currency: "GHS"
  email: string
  metadata: Record<string, unknown>
  reference: string
  callback_url: string
}

export type PaystackInitializeData = {
  access_code: string
  authorization_url: string
  reference: string
}

export type PaystackVerifyData = {
  id?: number
  amount: number
  currency: string
  gateway_response?: string
  paid_at: string | null
  reference: string
  status: string
}

function getSecretKey() {
  const secretKey = process.env.PAYSTACK_API_SECRET_KEY

  if (!secretKey) {
    throw new Error("PAYSTACK_API_SECRET_KEY is not configured")
  }

  return secretKey
}

export function getPaystackPublicKey() {
  const publicKey = process.env.PAYSTACK_API_PUBLIC_KEY

  if (!publicKey) {
    throw new Error("PAYSTACK_API_PUBLIC_KEY is not configured")
  }

  return publicKey
}

export function toPaystackSubunit(amount: number) {
  return Math.round(amount * 100)
}

async function paystackRequest<T>(
  path: string,
  init?: Omit<RequestInit, "headers"> & { headers?: HeadersInit }
) {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  const payload = (await response.json()) as PaystackResponse<T>

  if (!response.ok || !payload.status || !payload.data) {
    throw new Error(payload.message || "Paystack request failed")
  }

  return payload.data
}

export function initializePaystackTransaction(input: PaystackInitializeInput) {
  return paystackRequest<PaystackInitializeData>("/transaction/initialize", {
    body: JSON.stringify(input),
    method: "POST",
  })
}

export function verifyPaystackTransaction(reference: string) {
  return paystackRequest<PaystackVerifyData>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  )
}
