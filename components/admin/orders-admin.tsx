"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
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

type Payment = {
  id: string
  status: string
  amountPesewas: number
  reference: string
  createdAt: string
}
type Item = {
  id: string
  productNameSnapshot: string
  skuSnapshot: string
  sizeSnapshot?: string | null
  colorSnapshot?: string | null
  unitPricePesewas: number
  quantity: number
  lineTotalPesewas: number
  imageUrlSnapshot?: string | null
}
type Event = {
  id: string
  title: string
  description?: string | null
  location?: string | null
  occurredAt: string
}
type Order = {
  id: string
  orderNumber: string
  customerName: string
  email: string
  phone: string
  deliveryRegion: string
  deliveryCityTown: string
  deliveryStreetAddress: string
  status: string
  totalPesewas: number
  subtotalPesewas: number
  discountPesewas: number
  deliveryFeePesewas: number
  createdAt: string
  trackingNumber?: string | null
  carrier?: string | null
  items: Item[]
  payments: Payment[]
  events?: Event[]
}

const tone = (value: string) =>
  value === "DELIVERED" || value === "SUCCESS"
    ? "success"
    : value.includes("CANCEL") || value === "FAILED"
      ? "danger"
      : value.includes("PENDING")
        ? "warning"
        : "info"
export function OrdersAdmin() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const query = useAdminResource<Order[]>(
    ["orders", status],
    `/admin/orders${status ? `?status=${status}` : ""}`
  )
  const rows = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        `${item.orderNumber} ${item.customerName} ${item.email}`
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
  const columns: AdminColumn<Order>[] = [
    {
      label: "Order",
      render: (row) => (
        <div>
          <Link
            className="font-semibold hover:underline"
            href={`/admin/orders/${row.id}`}
          >
            {row.orderNumber}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatDate(row.createdAt)}
          </p>
        </div>
      ),
    },
    {
      label: "Customer",
      render: (row) => (
        <div>
          {row.customerName}
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { label: "Items", render: (row) => row.items.length },
    { label: "Total", render: (row) => formatPesewas(row.totalPesewas) },
    {
      label: "Payment",
      render: (row) => (
        <StatusBadge tone={tone(row.payments[0]?.status ?? "PENDING")}>
          {row.payments[0]?.status ?? "NOT STARTED"}
        </StatusBadge>
      ),
    },
    {
      label: "Fulfillment",
      render: (row) => (
        <StatusBadge tone={tone(row.status)}>
          {row.status.replaceAll("_", " ")}
        </StatusBadge>
      ),
    },
    {
      label: "",
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          render={<Link href={`/admin/orders/${row.id}`} />}
        >
          View
        </Button>
      ),
    },
  ]
  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Review immutable checkout snapshots, payments, fulfillment and delivery tracking."
      />
      <AdminListToolbar
        value={q}
        onChange={setQ}
        placeholder="Search order, customer or email"
        secondary={
          <select
            className="h-11 border border-outline-variant bg-white px-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {[
              "PENDING_PAYMENT",
              "CONFIRMED",
              "PROCESSING",
              "SHIPPED",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
              "CANCELLED",
              "REFUNDED",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        }
      />
      <AdminTable
        rows={rows}
        columns={columns}
        emptyTitle="No orders found"
        emptyDescription="Orders will appear here once customers complete checkout."
      />
    </>
  )
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const query = useAdminResource<Order>(
    ["order", orderId],
    `/admin/orders/${orderId}`
  )
  const [note, setNote] = useState("")
  const [carrier, setCarrier] = useState("")
  const [tracking, setTracking] = useState("")
  const [saving, setSaving] = useState(false)
  if (query.isLoading) return <LoadingPanel />
  if (query.isError || !query.data)
    return (
      <ErrorPanel
        message={query.error?.message ?? "Order not found"}
        retry={() => query.refetch()}
      />
    )
  const order = query.data
  const updateStatus = async (status: string) => {
    setSaving(true)
    try {
      const result = await api.patch<ApiResponse<unknown>>(
        `/admin/orders/${order.id}/status`,
        { status, note }
      )
      if (!result.data.success) throw new Error(result.data.message)
      setNote("")
      await query.refetch()
    } finally {
      setSaving(false)
    }
  }
  const updateTracking = async () => {
    setSaving(true)
    try {
      const result = await api.post<ApiResponse<unknown>>(
        `/admin/orders/${order.id}/tracking`,
        { carrier, trackingNumber: tracking, description: note }
      )
      if (!result.data.success) throw new Error(result.data.message)
      await query.refetch()
    } finally {
      setSaving(false)
    }
  }
  const transitions: Record<string, string[]> = {
    PENDING_PAYMENT: ["CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
    OUT_FOR_DELIVERY: ["DELIVERED"],
  }
  return (
    <>
      <AdminPageHeader
        title={order.orderNumber}
        description={`Placed ${formatDate(order.createdAt)} by ${order.customerName}`}
        actions={
          <Button variant="outline" render={<Link href="/admin/orders" />}>
            Back to orders
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <AdminCard>
            <div className="flex items-center justify-between border-b border-outline-variant p-5">
              <h2 className="font-heading text-xl font-semibold">Line items</h2>
              <StatusBadge tone={tone(order.status)}>
                {order.status.replaceAll("_", " ")}
              </StatusBadge>
            </div>
            <div className="divide-y divide-outline-variant">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold">{item.productNameSnapshot}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.skuSnapshot} · {item.sizeSnapshot || "One size"} ·{" "}
                      {item.colorSnapshot || "Default"} · Qty {item.quantity}
                    </p>
                  </div>
                  <span>{formatPesewas(item.lineTotalPesewas)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-outline-variant p-5 text-sm">
              <Line
                label="Subtotal"
                value={formatPesewas(order.subtotalPesewas)}
              />
              <Line
                label="Discount"
                value={`−${formatPesewas(order.discountPesewas)}`}
              />
              <Line
                label="Delivery"
                value={formatPesewas(order.deliveryFeePesewas)}
              />
              <Line
                label="Total"
                value={formatPesewas(order.totalPesewas)}
                strong
              />
            </div>
          </AdminCard>
          <AdminCard className="p-5">
            <h2 className="font-heading text-xl font-semibold">
              Tracking timeline
            </h2>
            <div className="mt-5 space-y-5 border-l border-outline-variant pl-5">
              {order.events?.map((event) => (
                <div key={event.id}>
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.description ||
                      event.location ||
                      "Order status updated"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.occurredAt)}
                  </p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
        <aside className="space-y-6">
          <AdminCard className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-semibold">
              Customer snapshot
            </h2>
            <p>{order.customerName}</p>
            <p className="text-sm text-muted-foreground">
              {order.email}
              <br />
              {order.phone}
            </p>
            <p className="text-sm">
              {order.deliveryStreetAddress}
              <br />
              {order.deliveryCityTown}, {order.deliveryRegion}
            </p>
          </AdminCard>
          <AdminCard className="space-y-4 p-5">
            <h2 className="font-heading text-lg font-semibold">
              Fulfillment actions
            </h2>
            <textarea
              className="min-h-20 w-full border border-outline-variant p-3 text-sm"
              placeholder="Optional operational note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {(transitions[order.status] ?? []).map((next) => (
              <Button
                key={next}
                className="w-full"
                variant={next === "CANCELLED" ? "destructive" : "outline"}
                disabled={saving}
                onClick={() => updateStatus(next)}
              >
                {next.replaceAll("_", " ")}
              </Button>
            ))}
          </AdminCard>
          <AdminCard className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-semibold">
              Delivery tracking
            </h2>
            <Input
              placeholder="Carrier"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            />
            <Input
              placeholder="Tracking number"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={saving || !carrier || !tracking}
              onClick={updateTracking}
            >
              Save tracking
            </Button>
          </AdminCard>
        </aside>
      </div>
    </>
  )
}
function Line({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={`flex justify-between ${strong ? "text-base font-semibold" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
