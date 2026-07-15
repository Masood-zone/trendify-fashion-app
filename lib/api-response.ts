import { NextResponse } from "next/server"
import { ZodError } from "zod"

import type { ApiResponse } from "@/types"

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, init)
}

export function fail(message: string, status = 400, code?: string) {
  return NextResponse.json<ApiResponse<never>>(
    { success: false, message, code },
    { status }
  )
}

export function invalid(error: ZodError) {
  const errors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "root"
    errors[key] = [...(errors[key] ?? []), issue.message]
  }
  return NextResponse.json<ApiResponse<never>>(
    {
      success: false,
      message: "Please correct the highlighted fields",
      errors,
    },
    { status: 422 }
  )
}

export function serverError(error: unknown) {
  console.error(error)
  return fail("An unexpected server error occurred", 500, "INTERNAL_ERROR")
}
