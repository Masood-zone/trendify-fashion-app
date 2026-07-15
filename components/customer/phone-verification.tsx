"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { normalizeGhanaPhone } from "@/lib/safe-redirect"

export function PhoneVerificationPanel({
  initialPhone = "",
  onVerified,
  onSkip,
}: {
  initialPhone?: string
  onVerified: (phone: string) => void | Promise<void>
  onSkip?: () => void | Promise<void>
}) {
  const [phone, setPhone] = useState(initialPhone)
  const [code, setCode] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function sendCode() {
    const normalized = normalizeGhanaPhone(phone)
    if (!/^\+233\d{9}$/.test(normalized)) {
      toast.error("Enter a valid Ghanaian phone number")
      return
    }
    setBusy(true)
    try {
      const result = await authClient.phoneNumber.sendOtp({ phoneNumber: normalized })
      if (result.error) throw new Error(result.error.message)
      setPhone(normalized)
      setSent(true)
      toast.success("A verification code has been sent by SMS")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The SMS could not be sent")
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode() {
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the six-digit verification code")
      return
    }
    setBusy(true)
    try {
      const result = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code,
        updatePhoneNumber: true,
      })
      if (result.error) throw new Error(result.error.message)
      toast.success("Phone number verified")
      await onVerified(phone)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Phone verification failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <label className="block text-sm font-medium">
        Ghanaian phone number
        <Input
          className="mt-2"
          type="tel"
          autoComplete="tel"
          placeholder="024 123 4567"
          value={phone}
          disabled={sent}
          onChange={(event) => setPhone(event.target.value)}
        />
      </label>
      {sent ? (
        <>
          <label className="block text-sm font-medium">
            Verification code
            <Input
              className="mt-2 text-center text-xl tracking-[0.4em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={busy || code.length !== 6} onClick={verifyCode}>
              {busy ? "Verifying…" : "Verify phone"}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setSent(false)}>
              Change number
            </Button>
          </div>
        </>
      ) : (
        <Button type="button" disabled={busy || !phone.trim()} onClick={sendCode}>
          {busy ? "Sending…" : "Send verification code"}
        </Button>
      )}
      {onSkip ? (
        <button type="button" className="block text-sm underline" disabled={busy} onClick={onSkip}>
          Skip for now
        </button>
      ) : null}
    </div>
  )
}
