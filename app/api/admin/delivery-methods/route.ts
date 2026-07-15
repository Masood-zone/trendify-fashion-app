import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"

export const deliveryMethodSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .transform((v) => v.toUpperCase()),
    name: z.string().trim().min(2).max(120),
    description: z.string().max(500).optional(),
    feePesewas: z.int().nonnegative(),
    estimatedMinDays: z.int().positive(),
    estimatedMaxDays: z.int().positive(),
    regions: z.array(z.string().trim().min(2)).default([]),
    active: z.boolean().default(true),
    sortOrder: z.int().default(0),
  })
  .refine((data) => data.estimatedMaxDays >= data.estimatedMinDays, {
    message:
      "Maximum delivery days must be greater than or equal to minimum days",
    path: ["estimatedMaxDays"],
  })
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.deliveryMethod.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
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
    const parsed = deliveryMethodSchema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const item = await prisma.deliveryMethod.create({ data: parsed.data })
    await auditAdmin(
      guard.session.user.id,
      "delivery-method.create",
      "DeliveryMethod",
      item.id
    )
    return ok(item, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
