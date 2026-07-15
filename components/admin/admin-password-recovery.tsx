"use client"

import Link from "next/link"
import { useState } from "react"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

type Stage = "request" | "reset" | "done"

export function AdminPasswordRecovery() {
  const [stage, setStage] = useState<Stage>("request")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function requestCode(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage("")
    await authClient.emailOtp.requestPasswordReset({ email })
    setStage("reset")
    setMessage("If this administrator account exists, a reset code has been sent.")
    setLoading(false)
  }

  async function reset(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    if (password.length < 8) return setMessage("Password must contain at least 8 characters.")
    if (password !== confirmPassword) return setMessage("Passwords do not match.")
    setLoading(true)
    const result = await authClient.emailOtp.resetPassword({ email, otp, password })
    setLoading(false)
    if (result.error) return setMessage(result.error.message || "The code is invalid or expired.")
    setStage("done")
  }

  if (stage === "done") {
    return (
      <div className="space-y-6 text-center">
        <MaterialSymbol icon="verified" className="text-5xl text-forest-green" />
        <h2 className="font-heading text-2xl font-semibold">Password reset complete</h2>
        <p className="text-sm text-muted-foreground">Your administrator password has been updated securely.</p>
        <Button render={<Link href="/admin/login" />} className="w-full">Return to Admin Login</Button>
      </div>
    )
  }

  return (
    <form onSubmit={stage === "request" ? requestCode : reset} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="recovery-email">Administrator email</label>
        <input id="recovery-email" type="email" required disabled={stage === "reset"} value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full border border-outline-variant bg-white px-4 outline-none focus:border-kente-gold" />
      </div>
      {stage === "reset" && (
        <>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="recovery-code">Six-digit code</label>
            <input id="recovery-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="h-12 w-full border border-outline-variant bg-white px-4 tracking-[0.5em] outline-none focus:border-kente-gold" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="new-password">New password</label>
            <input id="new-password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full border border-outline-variant bg-white px-4 outline-none focus:border-kente-gold" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="confirm-password">Confirm password</label>
            <input id="confirm-password" type="password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 w-full border border-outline-variant bg-white px-4 outline-none focus:border-kente-gold" />
          </div>
        </>
      )}
      {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
      <Button type="submit" disabled={loading} className="w-full bg-heritage-burgundy text-white hover:bg-heritage-burgundy/90">
        {loading ? "Please wait…" : stage === "request" ? "Send Reset Code" : "Reset Password"}
      </Button>
      <Link href="/admin/login" className="flex items-center justify-center gap-2 text-sm underline underline-offset-4">
        <MaterialSymbol icon="arrow_back" className="text-base" /> Back to login
      </Link>
    </form>
  )
}
