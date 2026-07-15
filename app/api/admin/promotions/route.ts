import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
export const promotionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .transform((v) => v.toUpperCase()),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_DELIVERY"]),
  value: z.int().nonnegative(),
  minimumSubtotalPesewas: z.int().nonnegative().optional().nullable(),
  maximumDiscountPesewas: z.int().nonnegative().optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  usageLimit: z.int().positive().optional().nullable(),
  perCustomerLimit: z.int().positive().optional().nullable(),
  appliesToAll: z.boolean().default(true),
  active: z.boolean().default(true),
  productIds: z.array(z.cuid()).optional(),
  categoryIds: z.array(z.cuid()).optional(),
})
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.promotion.findMany({
        where: { deletedAt: null },
        include: { _count: { select: { redemptions: true } } },
        orderBy: { createdAt: "desc" },
      })
    )
  } catch (error) {
    return serverError(error)
  }
}
export async function POST(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = promotionSchema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const { productIds, categoryIds, ...data } = parsed.data
    const item = await prisma.promotion.create({
      data: {
        ...data,
        products: productIds
          ? { create: productIds.map((productId) => ({ productId })) }
          : undefined,
        categories: categoryIds
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: { products: true, categories: true },
    })
    await auditAdmin(
      guard.session.user.id,
      "promotion.create",
      "Promotion",
      item.id
    )
    return ok(item, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
