import { randomBytes } from "node:crypto"
import { z } from "zod"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { resolveShopper } from "@/lib/shopper-context"
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  phone: z.string().max(20).optional(),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
})
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const shopper = await resolveShopper(request)
    const ticket = await prisma.supportTicket.create({
      data: {
        ...parsed.data,
        email: parsed.data.email.toLowerCase(),
        userId: shopper.userId,
        ticketNumber: `TKT-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`,
      },
    })
    return ok({ ticketNumber: ticket.ticketNumber }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
