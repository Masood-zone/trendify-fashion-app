import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import { checkoutConfigSchema } from "@/services/storefront/settings"
const schema = z.object({
  brandName: z.string().trim().min(2).max(120).optional(),
  supportEmail: z.email().optional().nullable(),
  supportPhone: z.string().max(20).optional().nullable(),
  whatsappNumber: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  socialLinks: z.record(z.string(), z.url()).optional(),
  checkoutConfig: checkoutConfigSchema.optional(),
})
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.storeSettings.findUnique({ where: { key: "default" } })
    )
  } catch (error) {
    return serverError(error)
  }
}
export async function PATCH(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const settings = await prisma.storeSettings.upsert({
      where: { key: "default" },
      create: {
        key: "default",
        ...parsed.data,
        socialLinks: parsed.data.socialLinks as never,
        checkoutConfig: parsed.data.checkoutConfig as never,
      },
      update: {
        ...parsed.data,
        socialLinks: parsed.data.socialLinks as never,
        checkoutConfig: parsed.data.checkoutConfig as never,
      },
    })
    await auditAdmin(
      guard.session.user.id,
      "settings.update",
      "StoreSettings",
      settings.id
    )
    return ok(settings)
  } catch (error) {
    return serverError(error)
  }
}
