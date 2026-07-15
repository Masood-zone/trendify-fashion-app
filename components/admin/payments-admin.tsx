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

type Payment = {
  id: string
  reference: string
  providerTransactionId?: string | null
  amountPesewas: number
  channel?: string | null
  mobileMoneyNetwork?: string | null
  payerPhoneMasked?: string | null
  status: string
  providerStatus?: string | null
  gatewayResponse?: string | null
  lastCheckedAt?: string | null
  verificationAttempts: number
  createdAt: string
  metadata?: unknown
  order: {
    id: string
    orderNumber: string
    customerName: string
    email: string
    items?: unknown[]
    events?: unknown[]
  }
}
const paymentTone = (status: string) =>
  status === "SUCCESS"
    ? "success"
    : ["FAILED", "CANCELLED"].includes(status)
      ? "danger"
      : "warning"
export function PaymentsAdmin() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const query = useAdminResource<Payment[]>(
    ["payments", status],
    `/admin/payments${status ? `?status=${status}` : ""}`
  )
  const rows = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        `${item.reference} ${item.order.orderNumber} ${item.order.customerName}`
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
  const columns: AdminColumn<Payment>[] = [
    {
      label: "Reference",
      render: (row) => (
        <div>
          <Link
            href={`/admin/payments/${row.id}`}
            className="font-semibold hover:underline"
          >
            {row.reference}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatDate(row.createdAt)}
          </p>
        </div>
      ),
    },
    {
      label: "Order",
      render: (row) => (
        <Link
          href={`/admin/orders/${row.order.id}`}
          className="hover:underline"
        >
          {row.order.orderNumber}
        </Link>
      ),
    },
    { label: "Customer", render: (row) => row.order.customerName },
    { label: "Amount", render: (row) => formatPesewas(row.amountPesewas) },
    {
      label: "Channel",
      render: (row) =>
        `${row.channel ?? "—"}${row.mobileMoneyNetwork ? ` · ${row.mobileMoneyNetwork}` : ""}`,
    },
    { label: "Provider", render: (row) => row.providerStatus ?? "Not checked" },
    {
      label: "Local",
      render: (row) => (
        <StatusBadge tone={paymentTone(row.status)}>{row.status}</StatusBadge>
      ),
    },
    {
      label: "",
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          render={<Link href={`/admin/payments/${row.id}`} />}
        >
          Inspect
        </Button>
      ),
    },
  ]
  return (
    <>
      <AdminPageHeader
        title="Payments"
        description="View Paystack attempts and securely recheck uncertain references. Success cannot be set manually."
      />
      <AdminListToolbar
        value={q}
        onChange={setQ}
        placeholder="Search reference, order or customer"
        secondary={
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 border border-outline-variant bg-white px-3"
          >
            <option value="">All local statuses</option>
            {["INITIALIZED", "PENDING", "SUCCESS", "FAILED", "CANCELLED"].map(
              (value) => (
                <option key={value}>{value}</option>
              )
            )}
          </select>
        }
      />
      <AdminTable
        rows={rows}
        columns={columns}
        emptyTitle="No payment attempts"
        emptyDescription="Paystack attempts will appear after checkout initialization."
      />
    </>
  )
}
export function PaymentDetail({ paymentId }: { paymentId: string }) {
  const query = useAdminResource<Payment>(
    ["payment", paymentId],
    `/admin/payments/${paymentId}`
  )
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState("")
  if (query.isLoading) return <LoadingPanel />
  if (query.isError || !query.data)
    return <ErrorPanel message={query.error?.message ?? "Payment not found"} />
  const payment = query.data
  const verify = async () => {
    setVerifying(true)
    setMessage("")
    try {
      const result = await api.post<
        ApiResponse<{ payment: { status: string } }>
      >(`/admin/payments/${payment.id}/verify`)
      if (!result.data.success) throw new Error(result.data.message)
      setMessage(
        `Paystack returned ${result.data.data?.payment.status ?? "an updated state"}.`
      )
      await query.refetch()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification failed")
    } finally {
      setVerifying(false)
    }
  }
  return (
    <>
      <AdminPageHeader
        title="Payment attempt"
        description={payment.reference}
        actions={
          <Button variant="outline" render={<Link href="/admin/payments" />}>
            Back to payments
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard className="space-y-4 p-6">
          <div className="flex justify-between">
            <h2 className="font-heading text-xl font-semibold">Local record</h2>
            <StatusBadge tone={paymentTone(payment.status)}>
              {payment.status}
            </StatusBadge>
          </div>
          <Detail label="Order" value={payment.order.orderNumber} />
          <Detail
            label="Customer"
            value={`${payment.order.customerName} · ${payment.order.email}`}
          />
          <Detail label="Amount" value={formatPesewas(payment.amountPesewas)} />
          <Detail
            label="Channel"
            value={`${payment.channel ?? "Unknown"}${payment.mobileMoneyNetwork ? ` · ${payment.mobileMoneyNetwork}` : ""}`}
          />
          <Detail
            label="Payer"
            value={payment.payerPhoneMasked ?? "Not supplied"}
          />
          <Detail label="Created" value={formatDate(payment.createdAt)} />
        </AdminCard>
        <AdminCard className="space-y-4 p-6">
          <h2 className="font-heading text-xl font-semibold">
            Provider verification
          </h2>
          <Detail
            label="Provider transaction"
            value={payment.providerTransactionId ?? "Not assigned"}
          />
          <Detail
            label="Provider status"
            value={payment.providerStatus ?? "Not checked"}
          />
          <Detail
            label="Gateway response"
            value={payment.gatewayResponse ?? "—"}
          />
          <Detail
            label="Last checked"
            value={
              payment.lastCheckedAt
                ? formatDate(payment.lastCheckedAt)
                : "Never"
            }
          />
          <Detail
            label="Verification attempts"
            value={String(payment.verificationAttempts)}
          />
          {message && (
            <p className="border border-outline-variant bg-surface-container-low p-3 text-sm">
              {message}
            </p>
          )}
          {["INITIALIZED", "PENDING"].includes(payment.status) && (
            <Button className="w-full" disabled={verifying} onClick={verify}>
              {verifying ? "Checking Paystack…" : "Verify with Paystack"}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            This action calls Paystack server-to-server. Administrators cannot
            force a success state or change the amount.
          </p>
        </AdminCard>
      </div>
    </>
  )
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-5 border-b border-outline-variant pb-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
