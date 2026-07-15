"use client"

import { useMutation } from "@tanstack/react-query"

import api from "@/lib/axios"
import { toApiClientError } from "@/lib/api-client-error"
import type { ApiResponse } from "@/types"

export const uploadPurposes = [
  "productImage",
  "brandLogo",
  "artisanImage",
  "categoryImage",
  "collectionImage",
  "homepageMedia",
  "contentMedia",
] as const

export type UploadPurpose = (typeof uploadPurposes)[number]

export interface UploadedCloudinaryFile {
  id: string
  publicId: string
  url: string
  previewUrl: string
  format?: string
  width?: number
  height?: number
  bytes?: number
}

export async function uploadFile(input: {
  file: File
  purpose: UploadPurpose
}) {
  const form = new FormData()
  form.append("file", input.file)
  form.append("purpose", input.purpose)
  try {
    const response = await api.post<ApiResponse<UploadedCloudinaryFile>>(
      "/uploads",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    if (!response.data.success || !response.data.data)
      throw new Error(response.data.message)
    return response.data.data
  } catch (error) {
    throw toApiClientError(error, "File upload failed")
  }
}

export function useUploadFile() {
  return useMutation({ mutationFn: uploadFile })
}
