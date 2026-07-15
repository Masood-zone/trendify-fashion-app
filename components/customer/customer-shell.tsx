import type { ReactNode } from "react"
export function CustomerShell({ children }: { children: ReactNode }) {
  return <div data-surface="customer-account">{children}</div>
}
