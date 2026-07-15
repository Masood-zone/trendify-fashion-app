import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  emailOTPClient,
  phoneNumberClient,
} from "better-auth/client/plugins"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api"
const AUTH_BASE_URL = `${API_BASE_URL.replace(/\/+$/, "")}/auth`

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [adminClient(), emailOTPClient(), phoneNumberClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
