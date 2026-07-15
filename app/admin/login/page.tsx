import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminAuthCard } from "@/components/admin/admin-auth-card"
import { AdminLoginForm } from "@/components/admin/admin-login-form"
import { auth } from "@/lib/auth"

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ callbackURL?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user.role === "ADMIN") redirect("/admin")
  const { callbackURL } = await searchParams
  return <AdminAuthCard title="Secure Administrator Login"><AdminLoginForm callbackURL={callbackURL} /></AdminAuthCard>
}
