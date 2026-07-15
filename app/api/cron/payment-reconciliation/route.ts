import { fail, ok, serverError } from "@/lib/api-response"
import { reconcilePendingPaystackPayments } from "@/services/payments/payment-workflow"

export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return fail("Unauthorized", 401)
  }
  try {
    return ok(await reconcilePendingPaystackPayments())
  } catch (error) {
    return serverError(error)
  }
}
