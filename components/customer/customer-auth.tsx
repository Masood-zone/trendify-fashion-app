"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import { authClient } from "@/lib/auth-client"
import { toastFormErrors } from "@/lib/form-toast"
import { normalizeGhanaPhone, safeInternalPath } from "@/lib/safe-redirect"

const loginImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBZsNCbJVA7MwV-Zzwhvoa_hqvkYAKOjm1kE04fy8o3dZUUonDeIf7rR9L8m9O-U8V2l0RKH9jm19umTsZJxqIL8WEIqtCWLWTOFG2qktX0wEh4a65JKFRsJOLBy3RTod4qqY3aiAcLzSpMcWAkHoLC1lN2eNoVKcLqmKjhb-Q4VMAXG0LoL35M9WFMIlBcubIA9bQ8eRIkAATyExmGhNAI1ttTA6CvYUqoKBr4SF0hE7lxLuj1Ihd6Fg"

const loginSchema = z.object({
  identity: z.string().trim().min(1, "Enter your email or phone number"),
  password: z.string().min(8, "Password must contain at least 8 characters"),
  rememberMe: z.boolean(),
})

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name"),
    lastName: z.string().trim().min(1, "Enter your last name"),
    email: z.string().trim().email("Enter a valid email address"),
    phoneNumber: z.string().trim(),
    password: z.string().min(8, "Password must contain at least 8 characters"),
    confirmation: z.string(),
    terms: z.boolean().refine(Boolean, {
      message: "Accept the terms to continue",
    }),
  })
  .refine((values) => values.password === values.confirmation, {
    path: ["confirmation"],
    message: "Passwords do not match",
  })

const verifyEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  otp: z.string().regex(/^\d{6}$/, "Enter the six-digit verification code"),
})

const passwordRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
})

const passwordResetSchema = z
  .object({
    otp: z.string().regex(/^\d{6}$/, "Enter the six-digit reset code"),
    password: z.string().min(8, "Password must contain at least 8 characters"),
    confirmation: z.string(),
  })
  .refine((values) => values.password === values.confirmation, {
    path: ["confirmation"],
    message: "Passwords do not match",
  })

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>
type VerifyEmailValues = z.infer<typeof verifyEmailSchema>
type PasswordRequestValues = z.infer<typeof passwordRequestSchema>
type PasswordResetValues = z.infer<typeof passwordResetSchema>

function AuthFrame({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-primary lg:block">
        <Image
          src={loginImage}
          alt="Contemporary Ghanaian fashion"
          fill
          priority
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-14 text-white">
          <p className="type-display">Fashion Trendify GH</p>
          <p className="type-label mt-6 text-tertiary-fixed">
            Modern heritage, made in Ghana
          </p>
        </div>
      </section>
      <section className="flex min-h-svh flex-col">
        <header className="flex h-20 items-center justify-between border-b border-outline-variant px-5 sm:px-10">
          <Link href="/" className="font-heading text-xl font-bold">
            Fashion Trendify GH
          </Link>
          <Link href="/shop" className="text-xs font-semibold uppercase">
            Back to shop
          </Link>
        </header>
        <div className="mx-auto flex w-full max-w-xl flex-1 items-center px-5 py-12 sm:px-10">
          <div className="w-full">
            <h1 className="type-headline-lg">{title}</h1>
            {children}
          </div>
        </div>
      </section>
    </main>
  )
}

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [show, setShow] = useState(false)
  const callback = safeInternalPath(params.get("callbackURL"), "/account")
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identity: "", password: "", rememberMe: true },
  })

  async function submit(values: LoginValues) {
    form.clearErrors("root")
    try {
      const phone = !values.identity.includes("@")
      const result = phone
        ? await authClient.signIn.phoneNumber({
            phoneNumber: normalizeGhanaPhone(values.identity),
            password: values.password,
            rememberMe: values.rememberMe,
          })
        : await authClient.signIn.email({
            email: values.identity.toLowerCase(),
            password: values.password,
            rememberMe: values.rememberMe,
          })
      if (result.error) {
        const message = result.error.message || "Login failed"
        form.setError("root", {
          message,
        })
        toast.error(message)
        return
      }
      if (result.data?.user.role !== "CUSTOMER") {
        await authClient.signOut()
        const message = "Use the administrator login for this account"
        form.setError("root", { message })
        toast.error(message)
        return
      }
      toast.success("Welcome back to Trendify")
      router.push(callback)
      router.refresh()
    } catch {
      const message = "Login could not be completed. Please try again."
      form.setError("root", { message })
      toast.error(message)
    }
  }

  return (
    <AuthFrame title="Akwaaba.">
      <p className="mt-2 text-muted-foreground">
        Log in to your customer account and continue your collection.
      </p>
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(submit, toastFormErrors)}
        noValidate
      >
        <Field
          label="Email or phone number"
          error={form.formState.errors.identity?.message}
        >
          <Input
            autoComplete="username"
            aria-invalid={Boolean(form.formState.errors.identity)}
            {...form.register("identity")}
          />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3"
              onClick={() => setShow((value) => !value)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex gap-2">
            <input type="checkbox" {...form.register("rememberMe")} /> Remember
            me
          </label>
          <Link href="/forgot-password" className="underline">
            Forgot password?
          </Link>
        </div>
        <FormError message={form.formState.errors.root?.message} />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Signing in…" : "Login"}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm">
        New to Trendify?{" "}
        <Link
          className="font-semibold underline"
          href={`/register?callbackURL=${encodeURIComponent(callback)}`}
        >
          Create account
        </Link>
      </p>
    </AuthFrame>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callback = safeInternalPath(params.get("callbackURL"), "/account")
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmation: "",
      terms: false,
    },
  })

  async function submit(values: RegisterValues) {
    form.clearErrors("root")
    try {
      const email = values.email.toLowerCase()
      const result = await authClient.signUp.email({
        name: `${values.firstName} ${values.lastName}`,
        email,
        password: values.password,
      })
      if (result.error) {
        const message = result.error.message || "Account could not be created"
        form.setError("root", {
          message,
        })
        toast.error(message)
        return
      }
      sessionStorage.setItem(
        "trendify_pending_verification",
        JSON.stringify({ email, callback })
      )
      sessionStorage.setItem(
        "trendify_pending_profile",
        JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber
            ? normalizeGhanaPhone(values.phoneNumber)
            : undefined,
        })
      )
      toast.success(
        "Account created. Check your email for the verification code."
      )
      router.push(
        `/verify-email?email=${encodeURIComponent(email)}&callbackURL=${encodeURIComponent(callback)}`
      )
    } catch {
      const message =
        "Account creation could not be completed. Please try again."
      form.setError("root", { message })
      toast.error(message)
    }
  }

  return (
    <AuthFrame title="Create Account">
      <p className="mt-2 text-muted-foreground">
        Join a community celebrating Ghanaian craft and contemporary style.
      </p>
      <form
        className="mt-8 grid gap-5 sm:grid-cols-2"
        onSubmit={form.handleSubmit(submit, toastFormErrors)}
        noValidate
      >
        <Field
          label="First name"
          error={form.formState.errors.firstName?.message}
        >
          <Input
            autoComplete="given-name"
            aria-invalid={Boolean(form.formState.errors.firstName)}
            {...form.register("firstName")}
          />
        </Field>
        <Field
          label="Last name"
          error={form.formState.errors.lastName?.message}
        >
          <Input
            autoComplete="family-name"
            aria-invalid={Boolean(form.formState.errors.lastName)}
            {...form.register("lastName")}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            label="Email address"
            error={form.formState.errors.email?.message}
          >
            <Input
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Ghanaian phone number (optional)"
            error={form.formState.errors.phoneNumber?.message}
          >
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="024 123 4567"
              aria-invalid={Boolean(form.formState.errors.phoneNumber)}
              {...form.register("phoneNumber")}
            />
          </Field>
        </div>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
        </Field>
        <Field
          label="Confirm password"
          error={form.formState.errors.confirmation?.message}
        >
          <Input
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.confirmation)}
            {...form.register("confirmation")}
          />
        </Field>
        <div className="sm:col-span-2">
          <label className="flex gap-3 text-sm">
            <input type="checkbox" {...form.register("terms")} />I agree to the
            Terms of Service and Privacy Policy.
          </label>
          {form.formState.errors.terms && (
            <p className="mt-2 text-sm text-error" role="alert">
              {form.formState.errors.terms.message}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <FormError message={form.formState.errors.root?.message} />
        </div>
        <Button
          type="submit"
          size="lg"
          className="sm:col-span-2"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-7 text-center text-sm">
        Already a member?{" "}
        <Link href="/login" className="font-semibold underline">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  )
}

export function VerifyEmailForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callback = safeInternalPath(params.get("callbackURL"), "/account")
  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: params.get("email") || "", otp: "" },
  })
  const otp = useWatch({ control: form.control, name: "otp" })

  async function submit(values: VerifyEmailValues) {
    form.clearErrors("root")
    try {
      const result = await authClient.emailOtp.verifyEmail({
        email: values.email.toLowerCase(),
        otp: values.otp,
      })
      if (result.error) {
        const message = result.error.message || "Verification failed"
        form.setError("root", {
          message,
        })
        toast.error(message)
        return
      }
      toast.success("Email verified successfully")
      try {
        const pendingProfile = JSON.parse(
          sessionStorage.getItem("trendify_pending_profile") || "null"
        )
        if (pendingProfile) await api.patch("/customer/profile", pendingProfile)
        sessionStorage.removeItem("trendify_pending_profile")
        sessionStorage.removeItem("trendify_pending_verification")
      } catch {
        toast.warning(
          "Your email is verified. Complete the remaining profile details in account settings."
        )
      }
      router.push(callback)
      router.refresh()
    } catch {
      const message = "Verification could not be completed. Please try again."
      form.setError("root", { message })
      toast.error(message)
    }
  }

  async function resendCode() {
    const emailIsValid = await form.trigger("email")
    if (!emailIsValid) {
      toast.error(
        form.getFieldState("email").error?.message ||
          "Enter a valid email address"
      )
      return
    }
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: form.getValues("email").toLowerCase(),
        type: "email-verification",
      })
      if (result.error) toast.error(result.error.message)
      else toast.success("A new code has been sent")
    } catch {
      toast.error("A new code could not be sent. Please try again.")
    }
  }

  return (
    <AuthFrame title="Verify your email">
      <p className="mt-2 text-muted-foreground">
        Enter the six-digit code sent to your email address.
      </p>
      <form
        className="mt-10 space-y-6"
        onSubmit={form.handleSubmit(submit, toastFormErrors)}
        noValidate
      >
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
        </Field>
        <Field
          label="Verification code"
          error={form.formState.errors.otp?.message}
        >
          <Input
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            className="text-center text-2xl tracking-[0.5em]"
            aria-invalid={Boolean(form.formState.errors.otp)}
            {...form.register("otp")}
            onInput={digitsOnly}
          />
        </Field>
        <FormError message={form.formState.errors.root?.message} />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting || otp.length !== 6}
        >
          {form.formState.isSubmitting ? "Verifying…" : "Verify email"}
        </Button>
      </form>
      <button
        type="button"
        className="mt-6 w-full text-center text-sm underline"
        onClick={resendCode}
      >
        Resend code
      </button>
    </AuthFrame>
  )
}

export function ForgotPasswordForm() {
  const router = useRouter()
  const [step, setStep] = useState<"request" | "reset">("request")
  const requestForm = useForm<PasswordRequestValues>({
    resolver: zodResolver(passwordRequestSchema),
    defaultValues: { email: "" },
  })
  const resetForm = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { otp: "", password: "", confirmation: "" },
  })
  const otp = useWatch({ control: resetForm.control, name: "otp" })

  async function requestCode(values: PasswordRequestValues) {
    requestForm.clearErrors("root")
    try {
      const result = await authClient.emailOtp.requestPasswordReset({
        email: values.email.toLowerCase(),
      })
      if (result.error) {
        const message = result.error.message || "Reset request failed"
        requestForm.setError("root", { message })
        toast.error(message)
        return
      }
      setStep("reset")
      toast.success("Check your email for the reset code")
    } catch {
      const message =
        "The reset request could not be completed. Please try again."
      requestForm.setError("root", { message })
      toast.error(message)
    }
  }

  async function resetPassword(values: PasswordResetValues) {
    resetForm.clearErrors("root")
    try {
      const result = await authClient.emailOtp.resetPassword({
        email: requestForm.getValues("email").toLowerCase(),
        otp: values.otp,
        password: values.password,
      })
      if (result.error) {
        const message = result.error.message || "Password reset failed"
        resetForm.setError("root", { message })
        toast.error(message)
        return
      }
      toast.success("Password updated. You can now sign in.")
      router.push("/login")
    } catch {
      const message = "The password could not be updated. Please try again."
      resetForm.setError("root", { message })
      toast.error(message)
    }
  }

  return (
    <AuthFrame title="Reset your password">
      {step === "request" ? (
        <>
          <p className="mt-2 text-muted-foreground">
            We will send a single-use reset code if the account exists.
          </p>
          <form
            className="mt-10 space-y-6"
            onSubmit={requestForm.handleSubmit(requestCode, toastFormErrors)}
            noValidate
          >
            <Field
              label="Email address"
              error={requestForm.formState.errors.email?.message}
            >
              <Input
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(requestForm.formState.errors.email)}
                {...requestForm.register("email")}
              />
            </Field>
            <FormError message={requestForm.formState.errors.root?.message} />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={requestForm.formState.isSubmitting}
            >
              {requestForm.formState.isSubmitting
                ? "Sending…"
                : "Send reset code"}
            </Button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-2 text-muted-foreground">
            Enter the code and choose a new password.
          </p>
          <form
            className="mt-10 space-y-5"
            onSubmit={resetForm.handleSubmit(resetPassword, toastFormErrors)}
            noValidate
          >
            <Field
              label="Reset code"
              error={resetForm.formState.errors.otp?.message}
            >
              <Input
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-invalid={Boolean(resetForm.formState.errors.otp)}
                {...resetForm.register("otp")}
                onInput={digitsOnly}
              />
            </Field>
            <Field
              label="New password"
              error={resetForm.formState.errors.password?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(resetForm.formState.errors.password)}
                {...resetForm.register("password")}
              />
            </Field>
            <Field
              label="Confirm password"
              error={resetForm.formState.errors.confirmation?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(resetForm.formState.errors.confirmation)}
                {...resetForm.register("confirmation")}
              />
            </Field>
            <FormError message={resetForm.formState.errors.root?.message} />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={resetForm.formState.isSubmitting || otp.length !== 6}
            >
              {resetForm.formState.isSubmitting
                ? "Updating…"
                : "Reset password"}
            </Button>
          </form>
        </>
      )}
    </AuthFrame>
  )
}

function digitsOnly(event: React.FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "")
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      className="bg-error-container border border-error/30 px-4 py-3 text-sm text-error"
      role="alert"
    >
      {message}
    </p>
  )
}

function Field({
  label,
  children,
  error,
}: {
  label: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-2">{children}</div>
      {error && (
        <span className="mt-2 block text-sm text-error" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}
