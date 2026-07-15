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

type Review = {
  id: string
  rating: number
  title?: string | null
  body: string
  status: string
  adminNote?: string | null
  moderatedAt?: string | null
  createdAt: string
  user: { name: string; email: string }
  product: { name: string }
  orderItem: { order: { orderNumber: string } }
}
const tone = (status: string) =>
  status === "APPROVED"
    ? "success"
    : status === "REJECTED"
      ? "danger"
      : "warning"
export function ReviewsAdmin() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const query = useAdminResource<Review[]>(
    ["reviews", status],
    `/admin/reviews${status ? `?status=${status}` : ""}`
  )
  const rows = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        `${item.user.name} ${item.product.name} ${item.title ?? ""}`
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
  const columns: AdminColumn<Review>[] = [
    {
      label: "Review",
      render: (row) => (
        <div>
          <Link
            href={`/admin/reviews/${row.id}`}
            className="font-semibold hover:underline"
          >
            {row.title || "Untitled review"}
          </Link>
          <p className="text-xs text-muted-foreground">
            {"★".repeat(row.rating)}
            {"☆".repeat(5 - row.rating)}
          </p>
        </div>
      ),
    },
    { label: "Product", render: (row) => row.product.name },
    {
      label: "Customer",
      render: (row) => (
        <div>
          {row.user.name}
          <p className="text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    {
      label: "Verified purchase",
      render: (row) => row.orderItem.order.orderNumber,
    },
    { label: "Submitted", render: (row) => formatDate(row.createdAt) },
    {
      label: "Status",
      render: (row) => (
        <StatusBadge tone={tone(row.status)}>{row.status}</StatusBadge>
      ),
    },
    {
      label: "",
      render: (row) => (
        <Button
          size="xs"
          variant="outline"
          render={<Link href={`/admin/reviews/${row.id}`} />}
        >
          Moderate
        </Button>
      ),
    },
  ]
  return (
    <>
      <AdminPageHeader
        title="Reviews"
        description="Moderate verified-purchase feedback before it contributes to storefront ratings."
      />
      <AdminListToolbar
        value={q}
        onChange={setQ}
        placeholder="Search customer, product or title"
        secondary={
          <select
            className="h-11 border border-outline-variant bg-white px-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option>PENDING</option>
            <option>APPROVED</option>
            <option>REJECTED</option>
          </select>
        }
      />
      <AdminTable
        rows={rows}
        columns={columns}
        emptyTitle="No reviews found"
        emptyDescription="Submitted customer reviews will appear here for moderation."
      />
    </>
  )
}
export function ReviewDetail({ reviewId }: { reviewId: string }) {
  const query = useAdminResource<Review>(
    ["review", reviewId],
    `/admin/reviews/${reviewId}`
  )
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  if (query.isLoading) return <LoadingPanel />
  if (query.isError || !query.data)
    return <ErrorPanel message={query.error?.message ?? "Review not found"} />
  const review = query.data
  const moderate = async (status: string) => {
    setSaving(true)
    try {
      const response = await api.patch<ApiResponse<unknown>>(
        `/admin/reviews/${review.id}/moderation`,
        { status, adminNote: note || null }
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
        title="Review moderation"
        description={`${review.product.name} · ${review.orderItem.order.orderNumber}`}
        actions={
          <Button variant="outline" render={<Link href="/admin/reviews" />}>
            Back to reviews
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard className="p-6">
          <div className="flex justify-between">
            <p className="text-xl text-kente-gold">
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
            </p>
            <StatusBadge tone={tone(review.status)}>
              {review.status}
            </StatusBadge>
          </div>
          <h2 className="mt-6 font-heading text-2xl font-semibold">
            {review.title || "Customer review"}
          </h2>
          <p className="mt-4 leading-7 whitespace-pre-wrap">{review.body}</p>
          <div className="mt-8 border-t border-outline-variant pt-4 text-sm text-muted-foreground">
            Submitted by {review.user.name} ({review.user.email}) on{" "}
            {formatDate(review.createdAt)}. The linked order item confirms a
            verified purchase.
          </div>
        </AdminCard>
        <AdminCard className="h-fit space-y-4 p-5">
          <h2 className="font-heading text-lg font-semibold">
            Moderation decision
          </h2>
          <textarea
            className="min-h-28 w-full border border-outline-variant p-3 text-sm"
            placeholder="Internal moderation note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            className="w-full"
            disabled={saving}
            onClick={() => moderate("APPROVED")}
          >
            Approve
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            disabled={saving || !note.trim()}
            onClick={() => moderate("REJECTED")}
          >
            Reject with note
          </Button>
          {review.status !== "PENDING" && (
            <Button
              variant="outline"
              className="w-full"
              disabled={saving}
              onClick={() => moderate("PENDING")}
            >
              Return to pending
            </Button>
          )}
        </AdminCard>
      </div>
    </>
  )
}
