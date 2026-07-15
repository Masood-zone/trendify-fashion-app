import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { CustomerShell } from "@/components/customer/customer-shell"
import { auth } from "@/lib/auth"
export default async function AccountLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login?callbackURL=/account")
  if (session.user.role !== "CUSTOMER") redirect("/")
  return <CustomerShell>{children}</CustomerShell>
}
