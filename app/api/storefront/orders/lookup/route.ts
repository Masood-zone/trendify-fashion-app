import { z } from "zod"

import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { hashShopperToken } from "@/lib/shopper-context"
import { serializeOrderDetail } from "@/services/orders/serialize-order"

const schema = z.object({
  orderNumber: z.string().trim().min(1).max(80),
  guestAccessToken: z.string().min(20).max(200),
})

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: parsed.data.orderNumber,
        userId: null,
        guestAccessTokenHash: hashShopperToken(parsed.data.guestAccessToken),
      },
      include: {
        items: { include: { review: { select: { id: true } } } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
        events: { orderBy: { occurredAt: "asc" } },
      },
    })
    return order
      ? ok(serializeOrderDetail(order))
      : fail("Order not found", 404, "NOT_FOUND")
  } catch (error) {
    return serverError(error)
  }
}
