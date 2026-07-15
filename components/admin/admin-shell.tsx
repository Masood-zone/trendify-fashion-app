import type { ReactNode } from "react"
export function AdminShell({ children }: { children: ReactNode }) {
  return <div data-surface="administrator">{children}</div>
}
