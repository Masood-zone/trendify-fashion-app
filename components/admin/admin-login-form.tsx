"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function AdminLoginForm({
  callbackURL = "/admin",
}: {
  callbackURL?: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      })
      if (result.error) throw new Error("Invalid administrator credentials")
      const session = await authClient.getSession()
      if (session.data?.user.role !== "ADMIN") {
        await authClient.signOut()
        throw new Error("This account does not have administrator access")
      }
      router.replace(callbackURL.startsWith("/admin") ? callbackURL : "/admin")
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div>
        <label
          htmlFor="admin-email"
          className="mb-2 block text-sm font-semibold tracking-wide"
        >
          Email Address
        </label>
        <div className="relative">
          <MaterialSymbol
            icon="mail"
            className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-14 w-full border border-outline-variant bg-white pr-4 pl-12 outline-none focus:border-kente-gold"
            placeholder="admin@fashiontrendify.gh"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="admin-password"
          className="mb-2 block text-sm font-semibold tracking-wide"
        >
          Password
        </label>
        <div className="relative">
          <MaterialSymbol
            icon="lock"
            className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-14 w-full border border-outline-variant bg-white pr-12 pl-12 outline-none focus:border-kente-gold"
            placeholder="••••••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center text-muted-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <MaterialSymbol
              icon={showPassword ? "visibility_off" : "visibility"}
            />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="size-4 accent-black"
          />
          Remember me
        </label>
        <Link
          href="/admin/forgot-password"
          className="underline underline-offset-4"
        >
          Forgot password?
        </Link>
      </div>
      {error && (
        <p
          role="alert"
          className="bg-error-container border border-error/30 px-4 py-3 text-sm text-error"
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="h-14 w-full bg-heritage-burgundy text-white hover:bg-heritage-burgundy/90"
      >
        {loading ? "Signing in…" : "Secure Admin Login"}
        <MaterialSymbol icon="shield_lock" />
      </Button>
    </form>
  )
}
