import { createHash, randomBytes } from "node:crypto"

import { auth } from "@/lib/auth"

export const GUEST_CART_COOKIE = "trendify_guest_cart"

export function hashShopperToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function newShopperToken() {
  return randomBytes(32).toString("base64url")
}

export async function resolveShopper(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GUEST_CART_COOKIE}=`))
    ?.slice(GUEST_CART_COOKIE.length + 1)
  return {
    userId: session?.user.id,
    guestToken: cookie ? decodeURIComponent(cookie) : undefined,
    guestTokenHash: cookie
      ? hashShopperToken(decodeURIComponent(cookie))
      : undefined,
  }
}
