"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { toastFormErrors } from "@/lib/form-toast"

const adminLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must contain at least 8 characters"),
  rememberMe: z.boolean(),
})

type AdminLoginValues = z.infer<typeof adminLoginSchema>

export function AdminLoginForm({
  callbackURL = "/admin",
}: {
  callbackURL?: string
}) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  })

  async function submit(values: AdminLoginValues) {
    clearErrors("root")
    try {
      const result = await authClient.signIn.email({
        email: values.email.toLowerCase(),
        password: values.password,
        rememberMe: values.rememberMe,
      })
      if (result.error) throw new Error("Invalid administrator credentials")
      const session = await authClient.getSession()
      if (session.data?.user.role !== "ADMIN") {
        await authClient.signOut()
        throw new Error("This account does not have administrator access")
      }
      toast.success("Administrator login successful")
      router.replace(callbackURL.startsWith("/admin") ? callbackURL : "/admin")
      router.refresh()
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Login failed"
      setError("root", {
        message,
      })
      toast.error(message)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit, toastFormErrors)}
      className="space-y-7"
      noValidate
    >
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
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
            className="h-14 w-full border border-outline-variant bg-white pr-4 pl-12 outline-none focus:border-kente-gold"
            placeholder="admin@fashiontrendify.gh"
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-error" role="alert">
            {errors.email.message}
          </p>
        )}
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
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
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
        {errors.password && (
          <p className="mt-2 text-sm text-error" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register("rememberMe")}
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
      {errors.root?.message && (
        <p
          role="alert"
          className="bg-error-container border border-error/30 px-4 py-3 text-sm text-error"
        >
          {errors.root.message}
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-14 w-full bg-heritage-burgundy text-white hover:bg-heritage-burgundy/90"
      >
        {isSubmitting ? "Signing in…" : "Secure Admin Login"}
        <MaterialSymbol icon="shield_lock" />
      </Button>
    </form>
  )
}
