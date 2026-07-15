import { z } from "zod"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
const schema = z.object({
  email: z.email(),
  source: z.string().max(80).optional(),
})
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email.toLowerCase() },
      create: {
        email: parsed.data.email.toLowerCase(),
        source: parsed.data.source,
      },
      update: {
        active: true,
        unsubscribedAt: null,
        source: parsed.data.source,
      },
    })
    return ok(subscriber, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
