import { fail, invalid, ok, serverError } from "@/lib/api-response"
import { requireCustomer } from "@/lib/customer-api"
import { prisma } from "@/lib/prisma"
import { addressSchema } from "@/app/api/customer/addresses/route"
export async function PATCH(
  request: Request,
  context: { params: Promise<{ addressId: string }> }
) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = addressSchema.partial().safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const id = (await context.params).addressId
    const found = await prisma.address.findFirst({
      where: { id, userId: guard.session.user.id, deletedAt: null },
    })
    if (!found) return fail("Address not found", 404)
    const address = await prisma.$transaction(async (tx) => {
      if (parsed.data.isDefault)
        await tx.address.updateMany({
          where: { userId: guard.session.user.id },
          data: { isDefault: false },
        })
      return tx.address.update({ where: { id }, data: parsed.data })
    })
    return ok(address)
  } catch (error) {
    return serverError(error)
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ addressId: string }> }
) {
  const guard = await requireCustomer(request)
  if ("response" in guard) return guard.response
  try {
    const result = await prisma.address.updateMany({
      where: {
        id: (await context.params).addressId,
        userId: guard.session.user.id,
        deletedAt: null,
      },
      data: { deletedAt: new Date(), isDefault: false },
    })
    return result.count
      ? ok({ archived: true })
      : fail("Address not found", 404)
  } catch (error) {
    return serverError(error)
  }
}
