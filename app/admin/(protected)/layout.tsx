import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { AdminShell } from "@/components/admin/admin-shell"
import { auth } from "@/lib/auth"

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/admin/login?callbackURL=/admin")
  if (session.user.role !== "ADMIN" || session.user.banned) redirect("/")
  return (
    <AdminShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    >
      {children}
    </AdminShell>
  )
}
