import { z } from "zod"

import { requireAdmin } from "@/lib/admin-api"
import { invalid, ok, serverError } from "@/lib/api-response"
import { uploadBuffer } from "@/lib/cloudinary/cloudinary-service"
import { prisma } from "@/lib/prisma"
const purposeSchema = z.enum([
  "productImage",
  "brandLogo",
  "artisanImage",
  "categoryImage",
  "collectionImage",
  "homepageMedia",
  "contentMedia",
])

export async function POST(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const form = await request.formData()
    const file = form.get("file")
    const parsed = purposeSchema.safeParse(form.get("purpose"))
    if (!parsed.success) return invalid(parsed.error)
    if (!(file instanceof File))
      return Response.json(
        { success: false, message: "A file is required" },
        { status: 422 }
      )
    if (file.size > 20 * 1024 * 1024)
      return Response.json(
        { success: false, message: "File exceeds 20MB" },
        { status: 413 }
      )

    const upload = await uploadBuffer({
      buffer: Buffer.from(await file.arrayBuffer()),
      filename: file.name,
      folder: `trendify-gh/${parsed.data}`,
    })
    const asset = await prisma.mediaAsset.create({
      data: {
        publicId: upload.public_id,
        url: upload.url,
        secureUrl: upload.secure_url,
        format: upload.format,
        mimeType: file.type,
        width: upload.width,
        height: upload.height,
        bytes: upload.bytes,
        uploadedById: guard.session.user.id,
      },
    })
    return ok(
      {
        id: asset.id,
        publicId: asset.publicId,
        url: asset.secureUrl,
        previewUrl: asset.secureUrl,
        format: asset.format ?? undefined,
        width: asset.width ?? undefined,
        height: asset.height ?? undefined,
        bytes: asset.bytes ?? undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    return serverError(error)
  }
}
