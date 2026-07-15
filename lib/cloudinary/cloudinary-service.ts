import { v2 as cloudinary } from "cloudinary"

export interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  url: string
  format?: string
  width?: number
  height?: number
  bytes?: number
  created_at?: string
  original_filename?: string
}

export type CloudinaryResourceType = "auto" | "image" | "raw"

let configured = false
let clockOffsetMs = 0
let clockOffsetCheckedAt = 0

function ensureConfigured() {
  if (configured) return

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are missing from environment")
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })

  configured = true
}

async function getUploadTimestamp(): Promise<number> {
  const now = Date.now()
  const offsetTtlMs = 5 * 60 * 1000

  if (clockOffsetCheckedAt && now - clockOffsetCheckedAt < offsetTtlMs) {
    return Math.floor((now + clockOffsetMs) / 1000)
  }

  try {
    const response = await fetch("https://api.cloudinary.com", {
      method: "HEAD",
      cache: "no-store",
    })
    const cloudinaryDate = response.headers.get("date")

    if (cloudinaryDate) {
      const serverTime = new Date(cloudinaryDate).getTime()
      if (!Number.isNaN(serverTime)) {
        clockOffsetMs = serverTime - now
        clockOffsetCheckedAt = now
      }
    }
  } catch (error) {
    console.warn("Could not check Cloudinary server time:", error)
  }

  return Math.floor((Date.now() + clockOffsetMs) / 1000)
}

export async function uploadBuffer(args: {
  buffer: Buffer
  folder?: string
  filename?: string
  resourceType?: CloudinaryResourceType
}): Promise<CloudinaryUploadResponse> {
  ensureConfigured()

  const resourceType = args.resourceType || "auto"
  const timestamp = await getUploadTimestamp()

  const result = await new Promise<CloudinaryUploadResponse>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: args.folder || "trendify-gh/uploads",
          filename_override: args.filename,
          resource_type: resourceType,
          timestamp,
          unique_filename: true,
          use_filename: true,
        },
        (error, uploadResult) => {
          if (error) {
            reject(error)
            return
          }

          resolve(uploadResult as CloudinaryUploadResponse)
        }
      )

      stream.end(args.buffer)
    }
  )

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    url: result.url,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    created_at: result.created_at,
    original_filename: result.original_filename,
  }
}

export async function uploadImageBuffer(args: {
  buffer: Buffer
  folder?: string
  filename?: string
}): Promise<CloudinaryUploadResponse> {
  return uploadBuffer({ ...args, resourceType: "image" })
}
