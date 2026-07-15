import { fail, ok, serverError } from "@/lib/api-response"
import { dispatchNotificationDeliveries } from "@/services/notifications/outbox"

export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return fail("Unauthorized", 401, "UNAUTHORIZED")
  }
  try {
    return ok(await dispatchNotificationDeliveries())
  } catch (error) {
    return serverError(error)
  }
}
