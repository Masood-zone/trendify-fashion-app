"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import api from "@/lib/axios"
import type { ApiResponse } from "@/types"
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
  MetricCard,
  StatusBadge,
} from "@/components/admin/admin-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAdminResource } from "@/services/admin/resources"

type Movement = {
  id: string
  type: string
  quantityDelta: number
  quantityAfter: number
  reservedAfter: number
  note?: string | null
  createdAt: string
}
type Variant = {
  id: string
  sku: string
  sizeLabel?: string | null
  colorName?: string | null
  stockQuantity: number
  reservedQuantity: number
  lowStockThreshold: number
  active: boolean
  product: { id: string; name: string }
  inventoryMovements: Movement[]
}
export function InventoryAdmin() {
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<Variant | null>(null)
  const [delta, setDelta] = useState(0)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const query = useAdminResource<Variant[]>(["inventory"], "/admin/inventory")
  const rows = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        `${item.sku} ${item.product.name}`
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [q, query.data]
  )
  if (query.isLoading) return <LoadingPanel />
  if (query.isError)
    return (
      <ErrorPanel message={query.error.message} retry={() => query.refetch()} />
    )
  const status = (item: Variant) =>
    item.stockQuantity - item.reservedQuantity <= 0
      ? "Out of stock"
      : item.stockQuantity - item.reservedQuantity <= item.lowStockThreshold
        ? "Low stock"
        : "In stock"
  const columns: AdminColumn<Variant>[] = [
    {
      label: "SKU",
      render: (row) => (
        <div>
          <p className="font-semibold">{row.sku}</p>
          <p className="text-xs text-muted-foreground">
            {row.sizeLabel || "One size"} · {row.colorName || "Default"}
          </p>
        </div>
      ),
    },
    {
      label: "Product",
      render: (row) => (
        <Link
          href={`/admin/products/${row.product.id}/edit`}
          className="hover:underline"
        >
          {row.product.name}
        </Link>
      ),
    },
    { label: "Physical", render: (row) => row.stockQuantity },
    { label: "Reserved", render: (row) => row.reservedQuantity },
    {
      label: "Available",
      render: (row) => Math.max(0, row.stockQuantity - row.reservedQuantity),
    },
    { label: "Threshold", render: (row) => row.lowStockThreshold },
    {
      label: "Status",
      render: (row) => (
        <StatusBadge tone={status(row) === "In stock" ? "success" : "danger"}>
          {status(row)}
        </StatusBadge>
      ),
    },
    {
      label: "",
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            setSelected(row)
            setDelta(0)
            setNote("")
          }}
        >
          Adjust
        </Button>
      ),
    },
  ]
  const adjust = async () => {
    if (!selected || !delta || !note.trim()) return
    setSaving(true)
    try {
      const response = await api.post<ApiResponse<unknown>>(
        `/admin/inventory/${selected.id}/adjustments`,
        { quantityDelta: delta, note }
      )
      if (!response.data.success) throw new Error(response.data.message)
      setSelected(null)
      await query.refetch()
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <AdminPageHeader
        title="Inventory"
        description="Track physical, reserved and available stock. Every stock change creates an immutable movement."
        actions={
          <Button
            variant="outline"
            render={<Link href="/api/admin/inventory/export" />}
          >
            Export CSV
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Variants"
          value={String(rows.length)}
          icon="inventory_2"
        />
        <MetricCard
          label="Low stock"
          value={String(
            rows.filter((item) => status(item) === "Low stock").length
          )}
          icon="warning"
          danger
        />
        <MetricCard
          label="Out of stock"
          value={String(
            rows.filter((item) => status(item) === "Out of stock").length
          )}
          icon="remove_shopping_cart"
          danger
        />
      </div>
      <AdminListToolbar
        value={q}
        onChange={setQ}
        placeholder="Search SKU or product"
      />
      <AdminTable
        rows={rows}
        columns={columns}
        emptyTitle="No inventory variants"
        emptyDescription="Add variants to a product to begin tracking stock."
        emptyAction={{ href: "/admin/products/new", label: "Add product" }}
      />
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <AdminCard className="w-full max-w-lg p-6">
            <h2 className="font-heading text-xl font-semibold">
              Adjust {selected.sku}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Current physical stock: {selected.stockQuantity}. Result:{" "}
              {selected.stockQuantity + delta}.
            </p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium">
                Signed quantity
                <Input
                  className="mt-1"
                  type="number"
                  value={delta}
                  onChange={(e) => setDelta(Number(e.target.value))}
                />
              </label>
              <label className="block text-sm font-medium">
                Reason
                <textarea
                  className="mt-1 min-h-24 w-full border border-outline-variant p-3"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={
                    saving ||
                    !delta ||
                    !note.trim() ||
                    selected.stockQuantity + delta < selected.reservedQuantity
                  }
                  onClick={adjust}
                >
                  {saving ? "Recording…" : "Record adjustment"}
                </Button>
              </div>
            </div>
            <div className="mt-6 border-t border-outline-variant pt-5">
              <h3 className="font-semibold">Recent movements</h3>
              <div className="mt-3 space-y-2">
                {selected.inventoryMovements.map((move) => (
                  <div key={move.id} className="flex justify-between text-sm">
                    <span>
                      {move.type} · {move.note ?? "System movement"}
                    </span>
                    <span
                      className={
                        move.quantityDelta >= 0
                          ? "text-green-700"
                          : "text-error"
                      }
                    >
                      {move.quantityDelta >= 0 ? "+" : ""}
                      {move.quantityDelta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </AdminCard>
        </div>
      )}
    </>
  )
}
