"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import api from "@/lib/axios"
import type { ApiResponse } from "@/types"
import { formatDate } from "@/lib/utils"
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

type Ticket = {
  id: string
  ticketNumber: string
  name: string
  email: string
  phone?: string | null
  subject: string
  message: string
  status: string
  adminNotes?: string | null
  resolvedAt?: string | null
  createdAt: string
  user?: { id: string; name: string; email: string } | null
}
const tone = (status: string) =>
  status === "RESOLVED" || status === "CLOSED"
    ? "success"
    : status === "IN_PROGRESS"
      ? "info"
      : "warning"
export function SupportAdmin() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const query = useAdminResource<Ticket[]>(
    ["support", status],
    `/admin/support${status ? `?status=${status}` : ""}`
  )
  const rows = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        `${item.ticketNumber} ${item.name} ${item.email} ${item.subject}`
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [q, query.data]
  )
  if (query.isLoading) return <LoadingPanel />
  if (query.isError) return <ErrorPanel message={query.error.message} />
  const columns: AdminColumn<Ticket>[] = [
    {
      label: "Ticket",
      render: (row) => (
        <div>
          <Link
            href={`/admin/support/${row.id}`}
            className="font-semibold hover:underline"
          >
            {row.ticketNumber}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatDate(row.createdAt)}
          </p>
        </div>
      ),
    },
    { label: "Subject", render: (row) => row.subject },
    {
      label: "Contact",
      render: (row) => (
        <div>
          {row.name}
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      label: "Status",
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
          render={<Link href={`/admin/support/${row.id}`} />}
        >
          Open
        </Button>
      ),
    },
  ]
  return (
    <>
      <AdminPageHeader
        title="Support tickets"
        description="Respond to customer and storefront contact requests with tracked internal resolution notes."
      />
      <AdminListToolbar
        value={q}
        onChange={setQ}
        placeholder="Search ticket, contact or subject"
        secondary={
          <select
            className="h-11 border border-outline-variant bg-white px-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option>OPEN</option>
            <option>IN_PROGRESS</option>
            <option>RESOLVED</option>
            <option>CLOSED</option>
          </select>
        }
      />
      <AdminTable
        rows={rows}
        columns={columns}
        emptyTitle="No support tickets"
        emptyDescription="Contact and support requests will appear here."
      />
    </>
  )
}
export function SupportDetail({ ticketId }: { ticketId: string }) {
  const query = useAdminResource<Ticket>(
    ["support-ticket", ticketId],
    `/admin/support/${ticketId}`
  )
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  if (query.isLoading) return <LoadingPanel />
  if (query.isError || !query.data)
    return <ErrorPanel message={query.error?.message ?? "Ticket not found"} />
  const ticket = query.data
  const update = async (status: string) => {
    setSaving(true)
    try {
      const response = await api.patch<ApiResponse<unknown>>(
        `/admin/support/${ticket.id}`,
        { status, adminNotes: notes || ticket.adminNotes || null }
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
        title={ticket.ticketNumber}
        description={ticket.subject}
        actions={
          <Button variant="outline" render={<Link href="/admin/support" />}>
            Back to support
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard className="p-6">
          <StatusBadge tone={tone(ticket.status)}>
            {ticket.status.replaceAll("_", " ")}
          </StatusBadge>
          <h2 className="mt-6 font-heading text-xl font-semibold">
            Original message
          </h2>
          <p className="mt-4 leading-7 whitespace-pre-wrap">{ticket.message}</p>
          <div className="mt-8 border-t border-outline-variant pt-4 text-sm text-muted-foreground">
            From {ticket.name} · {ticket.email}
            {ticket.phone ? ` · ${ticket.phone}` : ""}
            <br />
            Received {formatDate(ticket.createdAt)}
          </div>
          {ticket.user && (
            <Button
              className="mt-4"
              variant="outline"
              render={<Link href={`/admin/customers/${ticket.user.id}`} />}
            >
              View customer
            </Button>
          )}
        </AdminCard>
        <AdminCard className="h-fit space-y-4 p-5">
          <h2 className="font-heading text-lg font-semibold">Resolution</h2>
          <textarea
            className="min-h-40 w-full border border-outline-variant p-3 text-sm"
            placeholder="Internal administrator notes"
            value={notes || ticket.adminNotes || ""}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={ticket.status === status ? "secondary" : "outline"}
                disabled={saving || ticket.status === status}
                onClick={() => update(status)}
              >
                {status.replaceAll("_", " ")}
              </Button>
            ))}
          </div>
        </AdminCard>
      </div>
    </>
  )
}
