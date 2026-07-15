import Link from "next/link"
import type { ReactNode } from "react"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AdminPageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h1 className="font-heading text-3xl font-semibold md:text-4xl">{title}</h1><p className="mt-1 text-muted-foreground">{description}</p></div>{actions && <div className="flex flex-wrap gap-3">{actions}</div>}</div>
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("border border-outline-variant bg-white", className)}>{children}</section>
}

export function EmptyState({ icon = "inbox", title, description, actionHref, actionLabel }: { icon?: string; title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center"><MaterialSymbol icon={icon} className="mb-4 text-5xl text-surface-dim" /><h2 className="font-heading text-xl font-semibold">{title}</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>{actionHref && actionLabel && <Button render={<Link href={actionHref} />} className="mt-6">{actionLabel}</Button>}</div>
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "success" | "warning" | "danger" | "info" | "neutral" }) {
  const tones = { success: "bg-green-100 text-green-800", warning: "bg-amber-100 text-amber-800", danger: "bg-red-100 text-red-800", info: "bg-blue-100 text-blue-800", neutral: "bg-stone-100 text-stone-700" }
  return <span className={cn("inline-flex px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>
}

export function LoadingPanel() {
  return <div className="grid min-h-64 place-items-center border border-outline-variant bg-white"><MaterialSymbol icon="progress_activity" className="animate-spin text-3xl" /></div>
}

export function ErrorPanel({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="grid min-h-64 place-items-center border border-error/30 bg-error-container p-8 text-center"><div><MaterialSymbol icon="error" className="text-4xl text-error" /><p className="mt-3 text-sm text-error">{message}</p>{retry && <Button type="button" variant="outline" onClick={retry} className="mt-5">Try again</Button>}</div></div>
}

export function MetricCard({ label, value, icon, change, danger }: { label: string; value: string; icon: string; change?: number; danger?: boolean }) {
  return <AdminCard className={cn("p-5", danger && "border-error")}><div className="flex items-start justify-between"><span className={cn("grid size-10 place-items-center bg-primary text-white", danger && "bg-error")}><MaterialSymbol icon={icon} /></span>{change !== undefined && <span className={cn("text-xs font-semibold", change >= 0 ? "text-green-700" : "text-error")}>{change >= 0 ? "+" : ""}{change}%</span>}</div><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className={cn("mt-1 font-heading text-2xl font-semibold", danger && "text-error")}>{value}</p></AdminCard>
}
