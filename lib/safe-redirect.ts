export function safeInternalPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback
  try {
    const url = new URL(value, "http://trendify.local")
    return url.origin === "http://trendify.local"
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback
  } catch {
    return fallback
  }
}

export function normalizeGhanaPhone(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("233")) return `+${digits}`
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`
  return `+233${digits}`
}
