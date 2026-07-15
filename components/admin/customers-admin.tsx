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

type Customer = {
  id: string
  name: string
  email: string
  phoneNumber?: string | null
  emailVerified?: boolean
  phoneNumberVerified?: boolean
  banned: boolean
  banReason?: string | null
  createdAt: string
  lifetimeSpendPesewas?: number
  lastOrderAt?: string | null
  _count?: { orders: number }
  orders?: Array<{
    id: string
    orderNumber: string
    status: string
    totalPesewas: number
    createdAt: string
  }>
  addresses?: Array<{
    id: string
    label: string
    region: string
    cityTown: string
    streetAddress: string
  }>
  reviews?: Array<{ id: string; rating: number; status: string }>
  wishlistItems?: unknown[]
}
export function CustomersAdmin() {
  const [q, setQ] = useState("")
  const query = useAdminResource<Customer[]>(["customers"], "/admin/customers")
  const rows = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        `${item.name} ${item.email} ${item.phoneNumber ?? ""}`
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
  const columns: AdminColumn<Customer>[] = [
    {
      label: "Customer",
      render: (row) => (
        <div>
          <Link
            href={`/admin/customers/${row.id}`}
            className="font-semibold hover:underline"
          >
            {row.name}
          </Link>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { label: "Phone", render: (row) => row.phoneNumber || "—" },
    { label: "Orders", render: (row) => row._count?.orders ?? 0 },
    {
      label: "Lifetime spend",
      render: (row) => formatPesewas(row.lifetimeSpendPesewas ?? 0),
    },
    {
      label: "Last order",
      render: (row) => (row.lastOrderAt ? formatDate(row.lastOrderAt) : "—"),
    },
    {
      label: "Status",
      render: (row) => (
        <StatusBadge tone={row.banned ? "danger" : "success"}>
          {row.banned ? "Banned" : "Active"}
        </StatusBadge>
      ),
    },
    {
      label: "",
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          render={<Link href={`/admin/customers/${row.id}`} />}
        >
          View
        </Button>
      ),
    },
  ]
  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="Review customer accounts, verified contacts, addresses, activity and account access."
      />
      <AdminListToolbar
        value={q}
        onChange={setQ}
        placeholder="Search name, email or phone"
      />
      <AdminTable
        rows={rows}
        columns={columns}
        emptyTitle="No customers found"
        emptyDescription="Customer accounts will appear here after registration."
      />
    </>
  )
}
export function CustomerDetail({ customerId }: { customerId: string }) {
  const query = useAdminResource<Customer>(
    ["customer", customerId],
    `/admin/customers/${customerId}`
  )
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  if (query.isLoading) return <LoadingPanel />
  if (query.isError || !query.data)
    return <ErrorPanel message={query.error?.message ?? "Customer not found"} />
  const customer = query.data
  const lifetime =
    customer.orders?.reduce(
      (sum, item) =>
        item.status !== "CANCELLED" ? sum + item.totalPesewas : sum,
      0
    ) ?? 0
  const setBan = async (banned: boolean) => {
    setSaving(true)
    try {
      const response = await api.patch<ApiResponse<unknown>>(
        `/admin/customers/${customer.id}/status`,
        { banned, reason: banned ? reason : undefined }
      )
      if (!response.data.success) throw new Error(response.data.message)
      await query.refetch()
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <AdminPageHeader
        title={customer.name}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        actions={
          <Button variant="outline" render={<Link href="/admin/customers" />}>
            Back to customers
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <AdminCard className="p-5">
            <h2 className="font-heading text-xl font-semibold">
              Order history
            </h2>
            {customer.orders?.length ? (
              <div className="mt-4 divide-y divide-outline-variant">
                {customer.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex justify-between py-4 hover:underline"
                  >
                    <span>
                      {order.orderNumber} · {order.status.replaceAll("_", " ")}
                    </span>
                    <span>{formatPesewas(order.totalPesewas)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No orders yet.
              </p>
            )}
          </AdminCard>
          <AdminCard className="p-5">
            <h2 className="font-heading text-xl font-semibold">
              Saved addresses
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {customer.addresses?.map((address) => (
                <div
                  key={address.id}
                  className="border border-outline-variant p-4"
                >
                  <p className="font-semibold">{address.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {address.streetAddress}
                    <br />
                    {address.cityTown}, {address.region}
                  </p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
        <aside className="space-y-6">
          <AdminCard className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-semibold">Account</h2>
            <p>{customer.email}</p>
            <p className="text-sm text-muted-foreground">
              {customer.phoneNumber || "No phone number"}
            </p>
            <p className="text-sm">
              Email {customer.emailVerified ? "verified" : "not verified"}
              <br />
              Phone {customer.phoneNumberVerified ? "verified" : "not verified"}
            </p>
            <StatusBadge tone={customer.banned ? "danger" : "success"}>
              {customer.banned ? "Banned" : "Active"}
            </StatusBadge>
          </AdminCard>
          <AdminCard className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-semibold">
              Customer value
            </h2>
            <p className="font-heading text-2xl font-semibold">
              {formatPesewas(lifetime)}
            </p>
            <p className="text-sm text-muted-foreground">
              {customer.orders?.length ?? 0} orders ·{" "}
              {customer.reviews?.length ?? 0} reviews
            </p>
          </AdminCard>
          <AdminCard className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-semibold">
              Account access
            </h2>
            {customer.banned ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {customer.banReason || "No reason recorded"}
                </p>
                <Button
                  className="w-full"
                  disabled={saving}
                  onClick={() => setBan(false)}
                >
                  Unban customer
                </Button>
              </>
            ) : (
              <>
                <Input
                  placeholder="Reason for ban"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={saving || !reason.trim()}
                  onClick={() => setBan(true)}
                >
                  Ban and revoke sessions
                </Button>
              </>
            )}
          </AdminCard>
        </aside>
      </div>
    </>
  )
}
