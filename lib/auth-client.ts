import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  emailOTPClient,
  phoneNumberClient,
} from "better-auth/client/plugins"

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api"

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  plugins: [adminClient(), emailOTPClient(), phoneNumberClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
