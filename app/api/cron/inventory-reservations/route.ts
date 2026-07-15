import { fail, ok, serverError } from "@/lib/api-response"
import { releaseExpiredReservations } from "@/services/inventory/release-expired"

export async function GET(request: Request) {
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return fail("Unauthorized", 401)
  }
  try {
    return ok(await releaseExpiredReservations())
  } catch (error) {
    return serverError(error)
  }
}
