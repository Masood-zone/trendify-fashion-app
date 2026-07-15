"use client"

import Link from "next/link"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

type Stage = "request" | "reset" | "done"

const recoveryRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid administrator email"),
})

const recoveryResetSchema = z
  .object({
    otp: z.string().regex(/^\d{6}$/, "Enter the six-digit reset code"),
    password: z.string().min(8, "Password must contain at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

type RecoveryRequestValues = z.infer<typeof recoveryRequestSchema>
type RecoveryResetValues = z.infer<typeof recoveryResetSchema>

export function AdminPasswordRecovery() {
  const [stage, setStage] = useState<Stage>("request")
  const [message, setMessage] = useState("")
  const requestForm = useForm<RecoveryRequestValues>({
    resolver: zodResolver(recoveryRequestSchema),
    defaultValues: { email: "" },
  })
  const resetForm = useForm<RecoveryResetValues>({
    resolver: zodResolver(recoveryResetSchema),
    defaultValues: { otp: "", password: "", confirmPassword: "" },
  })

  async function requestCode(values: RecoveryRequestValues) {
    setMessage("")
    requestForm.clearErrors("root")
    try {
      await authClient.emailOtp.requestPasswordReset({
        email: values.email.toLowerCase(),
      })
      setStage("reset")
      setMessage(
        "If this administrator account exists, a reset code has been sent."
      )
    } catch {
      requestForm.setError("root", {
        message: "The reset request could not be completed. Please try again.",
      })
    }
  }

  async function reset(values: RecoveryResetValues) {
    resetForm.clearErrors("root")
    setMessage("")
    try {
      const result = await authClient.emailOtp.resetPassword({
        email: requestForm.getValues("email").toLowerCase(),
        otp: values.otp,
        password: values.password,
      })
      if (result.error) {
        resetForm.setError("root", {
          message: result.error.message || "The code is invalid or expired.",
        })
        return
      }
      setStage("done")
    } catch {
      resetForm.setError("root", {
        message: "The password could not be updated. Please try again.",
      })
    }
  }

  if (stage === "done") {
    return (
      <div className="space-y-6 text-center">
        <MaterialSymbol
          icon="verified"
          className="text-5xl text-forest-green"
        />
        <h2 className="font-heading text-2xl font-semibold">
          Password reset complete
        </h2>
        <p className="text-sm text-muted-foreground">
          Your administrator password has been updated securely.
        </p>
        <Button render={<Link href="/admin/login" />} className="w-full">
          Return to Admin Login
        </Button>
      </div>
    )
  }

  if (stage === "request") {
    return (
      <form
        onSubmit={requestForm.handleSubmit(requestCode)}
        className="space-y-5"
        noValidate
      >
        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="recovery-email"
          >
            Administrator email
          </label>
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(requestForm.formState.errors.email)}
            {...requestForm.register("email")}
            className="h-12 w-full border border-outline-variant bg-white px-4 outline-none focus:border-kente-gold"
          />
          {requestForm.formState.errors.email && (
            <p className="mt-2 text-sm text-error" role="alert">
              {requestForm.formState.errors.email.message}
            </p>
          )}
        </div>
        {requestForm.formState.errors.root?.message && (
          <p className="text-sm text-error" role="alert">
            {requestForm.formState.errors.root.message}
          </p>
        )}
        <Button
          type="submit"
          disabled={requestForm.formState.isSubmitting}
          className="w-full bg-heritage-burgundy text-white hover:bg-heritage-burgundy/90"
        >
          {requestForm.formState.isSubmitting
            ? "Please wait…"
            : "Send Reset Code"}
        </Button>
        <BackToLogin />
      </form>
    )
  }

  return (
    <form
      onSubmit={resetForm.handleSubmit(reset)}
      className="space-y-5"
      noValidate
    >
      <div>
        <label
          className="mb-2 block text-sm font-semibold"
          htmlFor="recovery-email"
        >
          Administrator email
        </label>
        <input
          id="recovery-email"
          type="email"
          value={requestForm.getValues("email")}
          readOnly
          className="h-12 w-full border border-outline-variant bg-surface-container px-4 text-muted-foreground outline-none"
        />
      </div>
      <div>
        <label
          className="mb-2 block text-sm font-semibold"
          htmlFor="recovery-code"
        >
          Six-digit code
        </label>
        <input
          id="recovery-code"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          aria-invalid={Boolean(resetForm.formState.errors.otp)}
          {...resetForm.register("otp")}
          onInput={(event) => {
            event.currentTarget.value = event.currentTarget.value.replace(
              /\D/g,
              ""
            )
          }}
          className="h-12 w-full border border-outline-variant bg-white px-4 tracking-[0.5em] outline-none focus:border-kente-gold"
        />
        {resetForm.formState.errors.otp && (
          <p className="mt-2 text-sm text-error" role="alert">
            {resetForm.formState.errors.otp.message}
          </p>
        )}
      </div>
      <div>
        <label
          className="mb-2 block text-sm font-semibold"
          htmlFor="new-password"
        >
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(resetForm.formState.errors.password)}
          {...resetForm.register("password")}
          className="h-12 w-full border border-outline-variant bg-white px-4 outline-none focus:border-kente-gold"
        />
        {resetForm.formState.errors.password && (
          <p className="mt-2 text-sm text-error" role="alert">
            {resetForm.formState.errors.password.message}
          </p>
        )}
      </div>
      <div>
        <label
          className="mb-2 block text-sm font-semibold"
          htmlFor="confirm-password"
        >
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(resetForm.formState.errors.confirmPassword)}
          {...resetForm.register("confirmPassword")}
          className="h-12 w-full border border-outline-variant bg-white px-4 outline-none focus:border-kente-gold"
        />
        {resetForm.formState.errors.confirmPassword && (
          <p className="mt-2 text-sm text-error" role="alert">
            {resetForm.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>
      {message && (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}
      {resetForm.formState.errors.root?.message && (
        <p className="text-sm text-error" role="alert">
          {resetForm.formState.errors.root.message}
        </p>
      )}
      <Button
        type="submit"
        disabled={resetForm.formState.isSubmitting}
        className="w-full bg-heritage-burgundy text-white hover:bg-heritage-burgundy/90"
      >
        {resetForm.formState.isSubmitting ? "Please wait…" : "Reset Password"}
      </Button>
      <BackToLogin />
    </form>
  )
}

function BackToLogin() {
  return (
    <Link
      href="/admin/login"
      className="flex items-center justify-center gap-2 text-sm underline underline-offset-4"
    >
      <MaterialSymbol icon="arrow_back" className="text-base" /> Back to login
    </Link>
  )
}
