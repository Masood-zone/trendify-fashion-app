import { auth } from "@/lib/auth"
import { fail } from "@/lib/api-response"

export async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session)
    return { response: fail("Authentication required", 401, "UNAUTHORIZED") }
  if (session.user.role !== "ADMIN" || session.user.banned) {
    return { response: fail("Administrator access required", 403, "FORBIDDEN") }
  }
  return { session }
}
