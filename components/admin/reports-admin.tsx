"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatPesewas } from "@/lib/utils"
import { useAdminResource } from "@/services/admin/resources"
import {
  AdminCard,
  AdminPageHeader,
  ErrorPanel,
  LoadingPanel,
  MetricCard,
} from "@/components/admin/admin-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Report = {
  revenuePesewas: number
  orderCount: number
  averageOrderValuePesewas: number
  newCustomers: number
  repeatCustomers: number
  payments: { successful: number; pending: number; failed: number }
  inventory: { valuePesewas: number; lowStock: number; outOfStock: number }
  ordersByStatus: Array<{ status: string; count: number }>
  salesByProduct: Array<{ name: string; valuePesewas: number }>
  salesByCategory: Array<{ name: string; valuePesewas: number }>
  discounts: { redemptionCount: number; valuePesewas: number }
}
const date = (offset: number) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)
export function ReportsAdmin() {
  const [from, setFrom] = useState(date(-30))
  const [to, setTo] = useState(date(0))
  const query = useAdminResource<Report>(
    ["reports", from, to],
    `/admin/reports?from=${from}&to=${to}`
  )
  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Live operational and commercial reporting from verified payments, orders, customers and inventory."
        actions={
          <Button
            variant="outline"
            render={
              <Link href={`/api/admin/reports/export?from=${from}&to=${to}`} />
            }
          >
            Export verified sales
          </Button>
        }
      />
      <AdminCard className="mb-6 flex flex-wrap items-end gap-4 p-4">
        <label className="text-sm font-medium">
          From
          <Input
            className="mt-1"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          To
          <Input
            className="mt-1"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <Button
          variant="ghost"
          onClick={() => {
            setFrom(date(-30))
            setTo(date(0))
          }}
        >
          Last 30 days
        </Button>
      </AdminCard>
      {query.isLoading ? (
        <LoadingPanel />
      ) : query.isError || !query.data ? (
        <ErrorPanel
          message={query.error?.message ?? "Reports could not be loaded"}
        />
      ) : (
        <ReportView data={query.data} />
      )}
    </>
  )
}
function ReportView({ data }: { data: Report }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Verified revenue"
          value={formatPesewas(data.revenuePesewas)}
          icon="payments"
        />
        <MetricCard
          label="Orders"
          value={String(data.orderCount)}
          icon="receipt_long"
        />
        <MetricCard
          label="Average order value"
          value={formatPesewas(data.averageOrderValuePesewas)}
          icon="monitoring"
        />
        <MetricCard
          label="Inventory value"
          value={formatPesewas(data.inventory.valuePesewas)}
          icon="inventory_2"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard className="p-5">
          <h2 className="font-heading text-xl font-semibold">
            Sales by category
          </h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesByCategory.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(value) =>
                    `₵${Math.round(Number(value) / 100)}`
                  }
                />
                <Tooltip formatter={(value) => formatPesewas(Number(value))} />
                <Bar dataKey="valuePesewas" fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
        <AdminCard className="p-5">
          <h2 className="font-heading text-xl font-semibold">
            Orders by status
          </h2>
          <div className="mt-5 space-y-3">
            {data.ordersByStatus.map((item) => (
              <div
                key={item.status}
                className="flex justify-between border-b border-outline-variant pb-3 text-sm"
              >
                <span>{item.status.replaceAll("_", " ")}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </AdminCard>
        <AdminCard className="p-5">
          <h2 className="font-heading text-xl font-semibold">Customer mix</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Metric label="New customers" value={data.newCustomers} />
            <Metric label="Repeat customers" value={data.repeatCustomers} />
          </div>
        </AdminCard>
        <AdminCard className="p-5">
          <h2 className="font-heading text-xl font-semibold">
            Payment and stock health
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Metric
              label="Successful payments"
              value={data.payments.successful}
            />
            <Metric label="Pending payments" value={data.payments.pending} />
            <Metric label="Failed payments" value={data.payments.failed} />
            <Metric
              label="Low / out of stock"
              value={`${data.inventory.lowStock} / ${data.inventory.outOfStock}`}
            />
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-container-low p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
    </div>
  )
}
