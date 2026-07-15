"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/axios"
import type { ApiResponse } from "@/types"
import { formatDate, formatPesewas } from "@/lib/utils"
import { useAdminResource } from "@/services/admin/resources"
import {
  AdminListToolbar,
  AdminTable,
  type AdminColumn,
} from "@/components/admin/admin-table"
import {
  AdminCard,
  AdminPageHeader,
  ErrorPanel,
  LoadingPanel,
  StatusBadge,
} from "@/components/admin/admin-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Promotion = {
  id: string
  code: string
  name: string
  description?: string | null
  type: string
  value: number
  minimumSubtotalPesewas?: number | null
  maximumDiscountPesewas?: number | null
  startsAt: string
  endsAt?: string | null
  usageLimit?: number | null
  perCustomerLimit?: number | null
  appliesToAll: boolean
  active: boolean
  products?: Array<{ productId: string }>
  categories?: Array<{ categoryId: string }>
  _count?: { redemptions: number }
}
type Named = { id: string; name: string }
export function DiscountsAdmin() {
  const [q, setQ] = useState("")
  const query = useAdminResource<Promotion[]>(
    ["promotions"],
    "/admin/promotions"
  )
  const rows = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        `${item.code} ${item.name}`.toLowerCase().includes(q.toLowerCase())
      ),
    [q, query.data]
  )
  if (query.isLoading) return <LoadingPanel />
  if (query.isError)
    return (
      <ErrorPanel message={query.error.message} retry={() => query.refetch()} />
    )
  const columns: AdminColumn<Promotion>[] = [
    {
      label: "Promotion",
      render: (row) => (
        <div>
          <p className="font-semibold">{row.code}</p>
          <p className="text-xs text-muted-foreground">{row.name}</p>
        </div>
      ),
    },
    {
      label: "Benefit",
      render: (row) =>
        row.type === "PERCENTAGE"
          ? `${row.value}%`
          : row.type === "FIXED_AMOUNT"
            ? formatPesewas(row.value)
            : "Free delivery",
    },
    {
      label: "Schedule",
      render: (row) => (
        <span>
          {formatDate(row.startsAt)}
          {row.endsAt ? ` – ${formatDate(row.endsAt)}` : " onward"}
        </span>
      ),
    },
    {
      label: "Uses",
      render: (row) =>
        `${row._count?.redemptions ?? 0}${row.usageLimit ? ` / ${row.usageLimit}` : ""}`,
    },
    {
      label: "Status",
      render: (row) => (
        <StatusBadge tone={row.active ? "success" : "neutral"}>
          {row.active ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    {
      label: "",
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          render={<Link href={`/admin/discounts/${row.id}/edit`} />}
        >
          Edit
        </Button>
      ),
    },
  ]
  return (
    <>
      <AdminPageHeader
        title="Discounts"
        description="Create scheduled codes with store-wide or scoped percentage, amount and delivery benefits."
        actions={
          <Button render={<Link href="/admin/discounts/new" />}>
            New promotion
          </Button>
        }
      />
      <AdminListToolbar
        value={q}
        onChange={setQ}
        placeholder="Search code or name"
      />
      <AdminTable
        rows={rows}
        columns={columns}
        emptyTitle="No promotions yet"
        emptyDescription="Create a promotion without adding mock redemption records."
        emptyAction={{
          href: "/admin/discounts/new",
          label: "Create promotion",
        }}
      />
    </>
  )
}
export function DiscountEditor({ promotionId }: { promotionId?: string }) {
  const router = useRouter()
  const query = useAdminResource<Promotion>(
    ["promotion", promotionId],
    promotionId ? `/admin/promotions/${promotionId}` : "",
    Boolean(promotionId)
  )
  const products = useAdminResource<Named[]>(
    ["products", "promotion-options"],
    "/admin/products"
  )
  const categories = useAdminResource<Named[]>(
    ["categories", "promotion-options"],
    "/admin/categories"
  )
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    type: "PERCENTAGE",
    value: "",
    minimum: "",
    maximum: "",
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: "",
    usageLimit: "",
    perCustomerLimit: "",
    appliesToAll: true,
    active: true,
  })
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [productIds, setProductIds] = useState<string[]>([])
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  if (promotionId && query.data && !loaded) {
    const item = query.data
    setLoaded(true)
    setProductIds(item.products?.map((entry) => entry.productId) ?? [])
    setCategoryIds(item.categories?.map((entry) => entry.categoryId) ?? [])
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      type: item.type,
      value:
        item.type === "PERCENTAGE"
          ? String(item.value)
          : String(item.value / 100),
      minimum:
        item.minimumSubtotalPesewas == null
          ? ""
          : String(item.minimumSubtotalPesewas / 100),
      maximum:
        item.maximumDiscountPesewas == null
          ? ""
          : String(item.maximumDiscountPesewas / 100),
      startsAt: item.startsAt.slice(0, 10),
      endsAt: item.endsAt?.slice(0, 10) ?? "",
      usageLimit: item.usageLimit == null ? "" : String(item.usageLimit),
      perCustomerLimit:
        item.perCustomerLimit == null ? "" : String(item.perCustomerLimit),
      appliesToAll: item.appliesToAll,
      active: item.active,
    })
  }
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    if (form.endsAt && form.endsAt < form.startsAt) {
      setMessage("End date cannot be before start date")
      setSaving(false)
      return
    }
    if (
      form.type === "PERCENTAGE" &&
      (Number(form.value) <= 0 || Number(form.value) > 100)
    ) {
      setMessage("Percentage must be between 1 and 100")
      setSaving(false)
      return
    }
    if (!form.appliesToAll && !productIds.length && !categoryIds.length) {
      setMessage(
        "Choose at least one product or category for a scoped promotion"
      )
      setSaving(false)
      return
    }
    const monetary = form.type !== "PERCENTAGE"
    const payload = {
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      value: monetary
        ? Math.round(Number(form.value) * 100)
        : Number(form.value),
      minimumSubtotalPesewas: form.minimum
        ? Math.round(Number(form.minimum) * 100)
        : null,
      maximumDiscountPesewas: form.maximum
        ? Math.round(Number(form.maximum) * 100)
        : null,
      startsAt: new Date(`${form.startsAt}T00:00:00`),
      endsAt: form.endsAt ? new Date(`${form.endsAt}T23:59:59`) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perCustomerLimit: form.perCustomerLimit
        ? Number(form.perCustomerLimit)
        : null,
      appliesToAll: form.appliesToAll,
      active: form.active,
      productIds: form.appliesToAll ? [] : productIds,
      categoryIds: form.appliesToAll ? [] : categoryIds,
    }
    try {
      const response = await api.request<ApiResponse<unknown>>({
        method: promotionId ? "patch" : "post",
        url: promotionId
          ? `/admin/promotions/${promotionId}`
          : "/admin/promotions",
        data: payload,
      })
      if (!response.data.success) throw new Error(response.data.message)
      router.push("/admin/discounts")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Promotion could not be saved"
      )
    } finally {
      setSaving(false)
    }
  }
  if (promotionId && query.isLoading) return <LoadingPanel />
  return (
    <form onSubmit={submit}>
      <AdminPageHeader
        title={promotionId ? "Edit promotion" : "New promotion"}
        description="Promotion validation is enforced again by the server before persistence."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              render={<Link href="/admin/discounts" />}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save promotion"}
            </Button>
          </>
        }
      />
      {message && (
        <p className="bg-error-container mb-5 p-3 text-sm text-error">
          {message}
        </p>
      )}
      <AdminCard className="mx-auto grid max-w-4xl gap-5 p-6 md:grid-cols-2">
        <Field label="Code">
          <Input
            required
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Name">
          <Input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Type">
          <select
            className="h-11 w-full border border-outline-variant bg-white px-3"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed amount</option>
            <option value="FREE_DELIVERY">Free delivery</option>
          </select>
        </Field>
        <Field
          label={form.type === "PERCENTAGE" ? "Percentage" : "Value (GHS)"}
        >
          <Input
            type="number"
            min="0"
            step="0.01"
            required={form.type !== "FREE_DELIVERY"}
            value={form.value}
            onChange={(e) => set("value", e.target.value)}
          />
        </Field>
        <Field label="Starts">
          <Input
            type="date"
            required
            value={form.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
          />
        </Field>
        <Field label="Ends">
          <Input
            type="date"
            value={form.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
          />
        </Field>
        <Field label="Minimum subtotal (GHS)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.minimum}
            onChange={(e) => set("minimum", e.target.value)}
          />
        </Field>
        <Field label="Maximum discount (GHS)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.maximum}
            onChange={(e) => set("maximum", e.target.value)}
          />
        </Field>
        <Field label="Total usage limit">
          <Input
            type="number"
            min="1"
            value={form.usageLimit}
            onChange={(e) => set("usageLimit", e.target.value)}
          />
        </Field>
        <Field label="Per-customer limit">
          <Input
            type="number"
            min="1"
            value={form.perCustomerLimit}
            onChange={(e) => set("perCustomerLimit", e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.appliesToAll}
            onChange={(e) => set("appliesToAll", e.target.checked)}
          />
          Applies store-wide
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          Active
        </label>
        {!form.appliesToAll && (
          <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
            <Scope
              title="Products"
              items={products.data ?? []}
              selected={productIds}
              onChange={setProductIds}
            />
            <Scope
              title="Categories"
              items={categories.data ?? []}
              selected={categoryIds}
              onChange={setCategoryIds}
            />
          </div>
        )}
        <label className="block text-sm font-medium md:col-span-2">
          Description
          <textarea
            className="mt-1 min-h-28 w-full border border-outline-variant p-3"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
      </AdminCard>
    </form>
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
function Scope({
  title,
  items,
  selected,
  onChange,
}: {
  title: string
  items: Named[]
  selected: string[]
  onChange: (value: string[]) => void
}) {
  return (
    <fieldset className="max-h-52 overflow-y-auto border border-outline-variant p-3">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {items.map((item) => (
        <label key={item.id} className="flex items-center gap-2 py-1 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...selected, item.id]
                  : selected.filter((id) => id !== item.id)
              )
            }
          />
          {item.name}
        </label>
      ))}
    </fieldset>
  )
}
