import { z } from "zod"
import { invalid, ok, serverError } from "@/lib/api-response"
import { requireCustomer } from "@/lib/customer-api"
import { prisma } from "@/lib/prisma"
const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  image: z.url().optional().nullable(),
})
export async function GET(request: Request) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.user.findUniqueOrThrow({
        where: { id: guard.session.user.id },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          emailVerified: true,
          phoneNumber: true,
          phoneNumberVerified: true,
          image: true,
          createdAt: true,
        },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
export async function PATCH(request: Request) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const user = await prisma.user.update({
      where: { id: guard.session.user.id },
      data: {
        ...parsed.data,
        name: `${parsed.data.firstName} ${parsed.data.lastName}`,
      },
    })
    return ok(user)
  } catch (error) {
    return serverError(error)
  }
}
