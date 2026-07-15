import { z } from "zod"
import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auditAdmin } from "@/services/admin/audit"
import sanitizeHtml from "sanitize-html"
export const contentSchema = z.object({
  type: z.enum(["PAGE", "POLICY", "FAQ"]).default("PAGE"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(200),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  mediaAssetId: z.cuid().optional().nullable(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(300).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
})
export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    return ok(
      await prisma.contentPage.findMany({
        where: { deletedAt: null },
        include: { mediaAsset: true },
        orderBy: { updatedAt: "desc" },
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
    const parsed = contentSchema.safeParse(await request.json())
    if (!parsed.success) return invalid(parsed.error)
    const item = await prisma.contentPage.create({
      data: { ...parsed.data, body: sanitizeHtml(parsed.data.body) },
    })
    await auditAdmin(
      guard.session.user.id,
      "content.create",
      "ContentPage",
      item.id
    )
    return ok(item, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
