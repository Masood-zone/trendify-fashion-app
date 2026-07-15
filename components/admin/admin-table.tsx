"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminCard, EmptyState } from "@/components/admin/admin-ui"

export type AdminColumn<T> = {
  label: string
  render: (row: T) => ReactNode
  className?: string
}

export function AdminTable<T extends { id: string }>({
  rows,
  columns,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  rows: T[]
  columns: AdminColumn<T>[]
  emptyTitle: string
  emptyDescription: string
  emptyAction?: { href: string; label: string }
}) {
  if (!rows.length)
    return (
      <AdminCard>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionHref={emptyAction?.href}
          actionLabel={emptyAction?.label}
        />
      </AdminCard>
    )
  return (
    <AdminCard className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-outline-variant bg-surface-container-low">
          <tr>
            {columns.map((column) => (
              <th
                key={column.label}
                className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface-container-low/60">
              {columns.map((column) => (
                <td
                  key={column.label}
                  className={`px-5 py-4 ${column.className ?? ""}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </AdminCard>
  )
}

export function AdminListToolbar({
  value,
  onChange,
  placeholder,
  addHref,
  addLabel,
  secondary,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  addHref?: string
  addLabel?: string
  secondary?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border border-outline-variant bg-white p-4 md:flex-row md:items-center">
      <div className="relative min-w-0 flex-1">
        <MaterialSymbol
          icon="search"
          className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      {secondary}
      {addHref && addLabel && (
        <Button render={<Link href={addHref} />}>
          <MaterialSymbol icon="add" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}
