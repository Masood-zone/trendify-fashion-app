import { auth } from "@/lib/auth"
import { fail } from "@/lib/api-response"

export async function requireCustomer(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session)
    return { response: fail("Authentication required", 401, "UNAUTHORIZED") }
  if (session.user.role !== "CUSTOMER" || session.user.banned) {
    return { response: fail("Customer access required", 403, "FORBIDDEN") }
  }
  return { session }
}
