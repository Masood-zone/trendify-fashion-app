"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import { authClient } from "@/lib/auth-client"
import { normalizeGhanaPhone, safeInternalPath } from "@/lib/safe-redirect"

const loginImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBZsNCbJVA7MwV-Zzwhvoa_hqvkYAKOjm1kE04fy8o3dZUUonDeIf7rR9L8m9O-U8V2l0RKH9jm19umTsZJxqIL8WEIqtCWLWTOFG2qktX0wEh4a65JKFRsJOLBy3RTod4qqY3aiAcLzSpMcWAkHoLC1lN2eNoVKcLqmKjhb-Q4VMAXG0LoL35M9WFMIlBcubIA9bQ8eRIkAATyExmGhNAI1ttTA6CvYUqoKBr4SF0hE7lxLuj1Ihd6Fg"

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
  const [identity, setIdentity] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const callback = safeInternalPath(params.get("callbackURL"), "/account")
  return (
    <AuthFrame title="Akwaaba.">
      <p className="mt-2 text-muted-foreground">
        Log in to your customer account and continue your collection.
      </p>
      <form
        className="mt-10 space-y-6"
        onSubmit={async (event) => {
          event.preventDefault()
          setSaving(true)
          const phone = !identity.includes("@")
          const result = phone
            ? await authClient.signIn.phoneNumber({
                phoneNumber: normalizeGhanaPhone(identity),
                password,
                rememberMe,
              })
            : await authClient.signIn.email({
                email: identity.trim().toLowerCase(),
                password,
                rememberMe,
              })
          setSaving(false)
          if (result.error)
            return toast.error(result.error.message || "Login failed")
          if (result.data?.user.role !== "CUSTOMER") {
            await authClient.signOut()
            return toast.error("Use the administrator login for this account")
          }
          router.push(callback)
          router.refresh()
        }}
      >
        <Field label="Email or phone number">
          <Input
            required
            value={identity}
            onChange={(event) => setIdentity(event.target.value)}
            autoComplete="username"
          />
        </Field>
        <Field label="Password">
          <div className="relative">
            <Input
              required
              minLength={8}
              type={show ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3"
              onClick={() => setShow((value) => !value)}
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
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />{" "}
            Remember me
          </label>
          <Link href="/forgot-password" className="underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? "Signing in…" : "Login"}
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
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmation: "",
  })
  const [terms, setTerms] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))
  return (
    <AuthFrame title="Create Account">
      <p className="mt-2 text-muted-foreground">
        Join a community celebrating Ghanaian craft and contemporary style.
      </p>
      <form
        className="mt-8 grid gap-5 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault()
          if (form.password !== form.confirmation)
            return toast.error("Passwords do not match")
          if (!terms) return toast.error("Please accept the terms to continue")
          setSaving(true)
          const email = form.email.trim().toLowerCase()
          const result = await authClient.signUp.email({
            name: `${form.firstName} ${form.lastName}`,
            email,
            password: form.password,
          })
          setSaving(false)
          if (result.error)
            return toast.error(
              result.error.message || "Account could not be created"
            )
          sessionStorage.setItem(
            "trendify_pending_verification",
            JSON.stringify({ email, callback })
          )
          sessionStorage.setItem(
            "trendify_pending_profile",
            JSON.stringify({
              firstName: form.firstName,
              lastName: form.lastName,
              phoneNumber: form.phoneNumber
                ? normalizeGhanaPhone(form.phoneNumber)
                : undefined,
            })
          )
          router.push(
            `/verify-email?email=${encodeURIComponent(email)}&callbackURL=${encodeURIComponent(callback)}`
          )
        }}
      >
        <Field label="First name">
          <Input
            required
            value={form.firstName}
            onChange={(event) => set("firstName", event.target.value)}
          />
        </Field>
        <Field label="Last name">
          <Input
            required
            value={form.lastName}
            onChange={(event) => set("lastName", event.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Email address">
            <Input
              required
              type="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Ghanaian phone number (optional)">
            <Input
              value={form.phoneNumber}
              onChange={(event) => set("phoneNumber", event.target.value)}
              placeholder="024 123 4567"
            />
          </Field>
        </div>
        <Field label="Password">
          <Input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(event) => set("password", event.target.value)}
          />
        </Field>
        <Field label="Confirm password">
          <Input
            required
            type="password"
            minLength={8}
            value={form.confirmation}
            onChange={(event) => set("confirmation", event.target.value)}
          />
        </Field>
        <label className="flex gap-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={terms}
            onChange={(event) => setTerms(event.target.checked)}
          />{" "}
          I agree to the Terms of Service and Privacy Policy.
        </label>
        <Button
          type="submit"
          size="lg"
          className="sm:col-span-2"
          disabled={saving}
        >
          {saving ? "Creating account…" : "Create account"}
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
  const [email, setEmail] = useState(params.get("email") || "")
  const [otp, setOtp] = useState("")
  const [saving, setSaving] = useState(false)
  const callback = safeInternalPath(params.get("callbackURL"), "/account")
  return (
    <AuthFrame title="Verify your email">
      <p className="mt-2 text-muted-foreground">
        Enter the six-digit code sent to your email address.
      </p>
      <form
        className="mt-10 space-y-6"
        onSubmit={async (event) => {
          event.preventDefault()
          setSaving(true)
          const result = await authClient.emailOtp.verifyEmail({
            email: email.toLowerCase(),
            otp,
          })
          if (!result.error) {
            try {
              const pendingProfile = JSON.parse(
                sessionStorage.getItem("trendify_pending_profile") || "null"
              )
              if (pendingProfile)
                await api.patch("/customer/profile", pendingProfile)
              sessionStorage.removeItem("trendify_pending_profile")
              sessionStorage.removeItem("trendify_pending_verification")
            } catch {
              toast.warning(
                "Your email is verified. Complete the remaining profile details in account settings."
              )
            }
          }
          setSaving(false)
          if (result.error)
            return toast.error(result.error.message || "Verification failed")
          router.push(callback)
          router.refresh()
        }}
      >
        <Field label="Email">
          <Input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Verification code">
          <Input
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            className="text-center text-2xl tracking-[0.5em]"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={saving || otp.length !== 6}
        >
          {saving ? "Verifying…" : "Verify email"}
        </Button>
      </form>
      <button
        className="mt-6 w-full text-center text-sm underline"
        onClick={async () => {
          const result = await authClient.emailOtp.sendVerificationOtp({
            email: email.toLowerCase(),
            type: "email-verification",
          })
          if (result.error) toast.error(result.error.message)
          else toast.success("A new code has been sent")
        }}
      >
        Resend code
      </button>
    </AuthFrame>
  )
}

export function ForgotPasswordForm() {
  const router = useRouter()
  const [step, setStep] = useState<"request" | "reset">("request")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [saving, setSaving] = useState(false)
  return (
    <AuthFrame title="Reset your password">
      {step === "request" ? (
        <>
          <p className="mt-2 text-muted-foreground">
            We will send a single-use reset code if the account exists.
          </p>
          <form
            className="mt-10 space-y-6"
            onSubmit={async (event) => {
              event.preventDefault()
              setSaving(true)
              const result = await authClient.emailOtp.requestPasswordReset({
                email: email.toLowerCase(),
              })
              setSaving(false)
              if (result.error) return toast.error(result.error.message)
              setStep("reset")
              toast.success("Check your email for the reset code")
            }}
          >
            <Field label="Email address">
              <Input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={saving}
            >
              {saving ? "Sending…" : "Send reset code"}
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
            onSubmit={async (event) => {
              event.preventDefault()
              if (password !== confirmation)
                return toast.error("Passwords do not match")
              setSaving(true)
              const result = await authClient.emailOtp.resetPassword({
                email: email.toLowerCase(),
                otp,
                password,
              })
              setSaving(false)
              if (result.error) return toast.error(result.error.message)
              toast.success("Password updated. You can now sign in.")
              router.push("/login")
            }}
          >
            <Field label="Reset code">
              <Input
                required
                maxLength={6}
                inputMode="numeric"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, ""))
                }
              />
            </Field>
            <Field label="New password">
              <Input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Field label="Confirm password">
              <Input
                required
                type="password"
                minLength={8}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </Field>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={saving || otp.length !== 6}
            >
              {saving ? "Updating…" : "Reset password"}
            </Button>
          </form>
        </>
      )}
    </AuthFrame>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  )
}
