"use client"

import { useState } from "react"
import api from "@/lib/axios"
import { formatPesewas } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { useAdminResource } from "@/services/admin/resources"
import {
  AdminCard,
  AdminPageHeader,
  ErrorPanel,
  LoadingPanel,
  StatusBadge,
} from "@/components/admin/admin-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Settings = {
  brandName: string
  supportEmail?: string | null
  supportPhone?: string | null
  whatsappNumber?: string | null
  address?: string | null
  socialLinks?: Record<string, string> | null
  checkoutConfig?: Record<string, unknown> | null
}
type Delivery = {
  id: string
  code: string
  name: string
  description?: string | null
  feePesewas: number
  estimatedMinDays: number
  estimatedMaxDays: number
  regions: string[]
  active: boolean
}
export function SettingsAdmin() {
  const [tab, setTab] = useState<
    "general" | "delivery" | "checkout" | "account"
  >("general")
  const settings = useAdminResource<Settings | null>(
    ["settings"],
    "/admin/settings"
  )
  const delivery = useAdminResource<Delivery[]>(
    ["delivery-methods"],
    "/admin/delivery-methods"
  )
  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Configure Trendify GH store identity, delivery, checkout behavior and administrator credentials."
      />
      <div className="mb-6 flex overflow-x-auto border-b border-outline-variant">
        {(["general", "delivery", "checkout", "account"] as const).map(
          (value) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-5 py-3 text-sm font-semibold capitalize ${tab === value ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
            >
              {value}
            </button>
          )
        )}
      </div>
      {settings.isLoading ? (
        <LoadingPanel />
      ) : settings.isError ? (
        <ErrorPanel message={settings.error.message} />
      ) : (
        <>
          {tab === "general" && (
            <GeneralForm
              initial={settings.data}
              refresh={() => settings.refetch()}
            />
          )}
          {tab === "delivery" && (
            <DeliverySettings
              rows={delivery.data ?? []}
              refresh={() => delivery.refetch()}
            />
          )}
          {tab === "checkout" && (
            <CheckoutForm
              initial={settings.data}
              refresh={() => settings.refetch()}
            />
          )}
          {tab === "account" && <AccountSettings />}
        </>
      )}
    </>
  )
}
function GeneralForm({
  initial,
  refresh,
}: {
  initial?: Settings | null
  refresh: () => unknown
}) {
  const [form, setForm] = useState({
    brandName: initial?.brandName ?? "Fashion Trendify GH",
    supportEmail: initial?.supportEmail ?? "",
    supportPhone: initial?.supportPhone ?? "",
    whatsappNumber: initial?.whatsappNumber ?? "",
    address: initial?.address ?? "",
    instagram: initial?.socialLinks?.instagram ?? "",
    facebook: initial?.socialLinks?.facebook ?? "",
  })
  const [saving, setSaving] = useState(false)
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    await api.patch("/admin/settings", {
      brandName: form.brandName,
      supportEmail: form.supportEmail || null,
      supportPhone: form.supportPhone || null,
      whatsappNumber: form.whatsappNumber || null,
      address: form.address || null,
      socialLinks: Object.fromEntries(
        Object.entries({
          instagram: form.instagram,
          facebook: form.facebook,
        }).filter(([, value]) => value)
      ),
    })
    await refresh()
    setSaving(false)
  }
  return (
    <AdminCard className="max-w-3xl p-6">
      <form onSubmit={save} className="grid gap-5 md:grid-cols-2">
        <Field label="Store name">
          <Input
            required
            value={form.brandName}
            onChange={(e) =>
              setForm((current) => ({ ...current, brandName: e.target.value }))
            }
          />
        </Field>
        <Field label="Support email">
          <Input
            type="email"
            value={form.supportEmail}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                supportEmail: e.target.value,
              }))
            }
          />
        </Field>
        <Field label="Support phone">
          <Input
            value={form.supportPhone}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                supportPhone: e.target.value,
              }))
            }
          />
        </Field>
        <Field label="WhatsApp number">
          <Input
            value={form.whatsappNumber}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                whatsappNumber: e.target.value,
              }))
            }
          />
        </Field>
        <Field label="Instagram URL">
          <Input
            type="url"
            value={form.instagram}
            onChange={(e) =>
              setForm((current) => ({ ...current, instagram: e.target.value }))
            }
          />
        </Field>
        <Field label="Facebook URL">
          <Input
            type="url"
            value={form.facebook}
            onChange={(e) =>
              setForm((current) => ({ ...current, facebook: e.target.value }))
            }
          />
        </Field>
        <label className="block text-sm font-medium md:col-span-2">
          Store address
          <textarea
            className="mt-1 min-h-24 w-full border border-outline-variant p-3"
            value={form.address}
            onChange={(e) =>
              setForm((current) => ({ ...current, address: e.target.value }))
            }
          />
        </label>
        <Button
          type="submit"
          disabled={saving}
          className="md:col-span-2 md:w-fit"
        >
          {saving ? "Saving…" : "Save general settings"}
        </Button>
      </form>
    </AdminCard>
  )
}
function DeliverySettings({
  rows,
  refresh,
}: {
  rows: Delivery[]
  refresh: () => unknown
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    fee: "",
    min: "1",
    max: "3",
    regions: "Greater Accra, Ashanti",
  })
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    await api.post("/admin/delivery-methods", {
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      feePesewas: Math.round(Number(form.fee) * 100),
      estimatedMinDays: Number(form.min),
      estimatedMaxDays: Number(form.max),
      regions: form.regions
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      active: true,
      sortOrder: rows.length,
    })
    setForm({
      code: "",
      name: "",
      description: "",
      fee: "",
      min: "1",
      max: "3",
      regions: "Greater Accra, Ashanti",
    })
    await refresh()
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-3">
        {rows.length ? (
          rows.map((item) => (
            <AdminCard key={item.id} className="flex justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">
                  {item.name}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({item.code})
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPesewas(item.feePesewas)} · {item.estimatedMinDays}–
                  {item.estimatedMaxDays} business days ·{" "}
                  {item.regions.join(", ") || "All Ghana"}
                </p>
              </div>
              <StatusBadge tone={item.active ? "success" : "neutral"}>
                {item.active ? "Active" : "Inactive"}
              </StatusBadge>
            </AdminCard>
          ))
        ) : (
          <AdminCard className="p-8 text-center text-sm text-muted-foreground">
            No delivery methods configured.
          </AdminCard>
        )}
      </div>
      <AdminCard className="h-fit p-5">
        <h2 className="font-heading text-xl font-semibold">
          Add delivery method
        </h2>
        <form className="mt-5 space-y-3" onSubmit={submit}>
          <Input
            required
            placeholder="Code, e.g. ACCRA_SAME_DAY"
            value={form.code}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                code: e.target.value.toUpperCase().replaceAll(" ", "_"),
              }))
            }
          />
          <Input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm((current) => ({ ...current, name: e.target.value }))
            }
          />
          <Input
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="Fee in GHS"
            value={form.fee}
            onChange={(e) =>
              setForm((current) => ({ ...current, fee: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min="1"
              value={form.min}
              onChange={(e) =>
                setForm((current) => ({ ...current, min: e.target.value }))
              }
            />
            <Input
              type="number"
              min="1"
              value={form.max}
              onChange={(e) =>
                setForm((current) => ({ ...current, max: e.target.value }))
              }
            />
          </div>
          <Input
            placeholder="Regions, comma separated"
            value={form.regions}
            onChange={(e) =>
              setForm((current) => ({ ...current, regions: e.target.value }))
            }
          />
          <Button className="w-full" type="submit">
            Add method
          </Button>
        </form>
      </AdminCard>
    </div>
  )
}
function CheckoutForm({
  initial,
  refresh,
}: {
  initial?: Settings | null
  refresh: () => unknown
}) {
  const config = initial?.checkoutConfig ?? {}
  const [guestCheckout, setGuestCheckout] = useState(
    config.guestCheckout !== false
  )
  const [reservationMinutes, setReservationMinutes] = useState(
    String(config.reservationMinutes ?? 20)
  )
  const [taxPercent, setTaxPercent] = useState(
    String(Number(config.taxRateBasisPoints ?? 0) / 100)
  )
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(
    config.freeDeliveryThresholdPesewas == null
      ? ""
      : String(Number(config.freeDeliveryThresholdPesewas) / 100)
  )
  const save = async () => {
    await api.patch("/admin/settings", {
      checkoutConfig: {
        ...config,
        guestCheckout,
        reservationMinutes: Number(reservationMinutes),
        taxRateBasisPoints: Math.round(Number(taxPercent || 0) * 100),
        freeDeliveryThresholdPesewas: freeDeliveryThreshold
          ? Math.round(Number(freeDeliveryThreshold) * 100)
          : null,
        country: "GH",
        currency: "GHS",
      },
    })
    await refresh()
  }
  return (
    <AdminCard className="max-w-2xl space-y-5 p-6">
      <h2 className="font-heading text-xl font-semibold">
        Checkout configuration
      </h2>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={guestCheckout}
          onChange={(e) => setGuestCheckout(e.target.checked)}
        />
        Allow guest checkout
      </label>
      <Field label="Inventory reservation window (minutes)">
        <Input
          type="number"
          min="5"
          max="180"
          value={reservationMinutes}
          onChange={(e) => setReservationMinutes(e.target.value)}
        />
      </Field>
      <Field label="Tax rate (%)">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={taxPercent}
          onChange={(e) => setTaxPercent(e.target.value)}
        />
      </Field>
      <Field label="Free-delivery threshold (GHS, optional)">
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="No automatic free delivery"
          value={freeDeliveryThreshold}
          onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
        />
      </Field>
      <p className="text-sm text-muted-foreground">
        V1 is fixed to Ghana delivery, Ghana cedis, and server-side Paystack
        verification.
      </p>
      <Button onClick={save}>Save checkout settings</Button>
    </AdminCard>
  )
}
function AccountSettings() {
  const { data } = authClient.useSession()
  const [name, setName] = useState(data?.user.name ?? "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const saveProfile = async () => {
    const result = await authClient.updateUser({ name })
    setMessage(result.error?.message ?? "Profile updated")
  }
  const changePassword = async () => {
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })
    setMessage(
      result.error?.message ?? "Password updated and other sessions revoked"
    )
    setCurrentPassword("")
    setNewPassword("")
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AdminCard className="space-y-4 p-6">
        <h2 className="font-heading text-xl font-semibold">
          Administrator profile
        </h2>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input value={data?.user.email ?? ""} disabled />
        </Field>
        <Button onClick={saveProfile}>Update profile</Button>
      </AdminCard>
      <AdminCard className="space-y-4 p-6">
        <h2 className="font-heading text-xl font-semibold">Change password</h2>
        <Field label="Current password">
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field label="New password">
          <Input
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Button
          disabled={!currentPassword || newPassword.length < 8}
          onClick={changePassword}
        >
          Change password
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </AdminCard>
    </div>
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
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  )
}
