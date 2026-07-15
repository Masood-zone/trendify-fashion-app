import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPesewas(value: number, compact = false) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value / 100)
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GH", options ?? { dateStyle: "medium" }).format(new Date(value))
}
