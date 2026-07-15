import { z } from "zod"
import { invalid, ok, serverError } from "@/lib/api-response"
import { requireCustomer } from "@/lib/customer-api"
import { prisma } from "@/lib/prisma"
export const addressSchema = z.object({
  label: z.string().max(50).optional(),
  recipientName: z.string().trim().min(2).max(120),
  phone: z.string().min(9).max(20),
  alternatePhone: z.string().max(20).optional(),
  region: z.string().min(2).max(80),
  cityTown: z.string().min(2).max(100),
  areaSuburb: z.string().max(100).optional(),
  ghanaPostGps: z.string().max(30).optional(),
  streetAddress: z.string().min(3).max(250),
  nearbyLandmark: z.string().max(250).optional(),
  deliveryInstructions: z.string().max(500).optional(),
  isDefault: z.boolean().default(false),
})
export async function GET(request: Request) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.address.findMany({
        where: { userId: guard.session.user.id, deletedAt: null },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
export async function POST(request: Request) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = addressSchema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const address = await prisma.$transaction(async (tx) => {
      if (parsed.data.isDefault)
        await tx.address.updateMany({
          where: { userId: guard.session.user.id },
          data: { isDefault: false },
        })
      return tx.address.create({
        data: { ...parsed.data, userId: guard.session.user.id },
      })
    })
    return ok(address, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
