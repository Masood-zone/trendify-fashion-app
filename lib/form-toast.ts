import type { FieldErrors, FieldValues } from "react-hook-form"
import { toast } from "sonner"

function firstErrorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined

  if (
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string"
  ) {
    return (value as { message: string }).message
  }

  for (const nested of Object.values(value)) {
    const message = firstErrorMessage(nested)
    if (message) return message
  }

  return undefined
}

export function toastFormErrors<TValues extends FieldValues>(
  errors: FieldErrors<TValues>
) {
  toast.error(
    firstErrorMessage(errors) || "Please correct the highlighted fields."
  )
}
