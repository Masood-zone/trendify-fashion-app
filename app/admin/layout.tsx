import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { auth } from "@/lib/auth"
export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login?callbackURL=/admin")
  if (session.user.role !== "ADMIN") redirect("/")
  return <AdminShell>{children}</AdminShell>
}
