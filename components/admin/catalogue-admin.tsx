"use client"

import { useMemo, useState } from "react"
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
import { useAdminMutation, useAdminResource } from "@/services/admin/resources"

type Kind = "categories" | "collections" | "brands" | "artisans"
type Item = {
  id: string
  name: string
  slug: string
  description?: string | null
  status?: string
  active?: boolean
  featured?: boolean
  sortOrder: number
  parent?: { name: string } | null
  region?: string | null
  _count?: { products?: number }
}
const labels: Record<Kind, string> = {
  categories: "Categories",
  collections: "Collections",
  brands: "Brands",
  artisans: "Artisans",
}

export function CatalogueAdmin() {
  const [kind, setKind] = useState<Kind>("categories")
  const [q, setQ] = useState("")
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    region: "",
    featured: false,
  })
  const query = useAdminResource<Item[]>([kind], `/admin/${kind}`)
  const create = useAdminMutation<Record<string, unknown>>({
    method: "post",
    path: `/admin/${kind}`,
    invalidate: [[kind]],
  })
  const archive = useAdminMutation<{ id: string }>({
    method: "delete",
    path: (payload) => `/admin/${kind}/${payload.id}`,
    invalidate: [[kind]],
  })
  const rows = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        item.name.toLowerCase().includes(q.toLowerCase())
      ),
    [q, query.data]
  )
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      name: form.name,
      slug:
        form.slug ||
        form.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      description: form.description || undefined,
      ...(kind === "collections"
        ? { status: "DRAFT", featured: form.featured }
        : { active: true, featured: form.featured }),
      ...(kind === "artisans" ? { region: form.region || undefined } : {}),
      sortOrder: 0,
    }
    create.mutate(payload, {
      onSuccess: () =>
        setForm({
          name: "",
          slug: "",
          description: "",
          region: "",
          featured: false,
        }),
    })
  }
  const columns: AdminColumn<Item>[] = [
    {
      label: "Name",
      render: (row) => (
        <div>
          <p className="font-semibold">{row.name}</p>
          <p className="text-xs text-muted-foreground">/{row.slug}</p>
        </div>
      ),
    },
    {
      label: "Parent / Region",
      render: (row) => row.parent?.name ?? row.region ?? "—",
    },
    { label: "Order", render: (row) => row.sortOrder },
    { label: "Featured", render: (row) => (row.featured ? "Yes" : "No") },
    {
      label: "Status",
      render: (row) => (
        <StatusBadge
          tone={
            (row.active ?? row.status === "PUBLISHED") ? "success" : "warning"
          }
        >
          {row.status ?? (row.active ? "Active" : "Inactive")}
        </StatusBadge>
      ),
    },
    {
      label: "",
      render: (row) => (
        <Button
          size="xs"
          variant="ghost"
          onClick={() => {
            if (
              confirm(
                `Archive ${row.name}? Referenced records will remain intact.`
              )
            )
              archive.mutate({ id: row.id })
          }}
        >
          Archive
        </Button>
      ),
    },
  ]
  return (
    <>
      <AdminPageHeader
        title="Catalogue organization"
        description="Manage the categories, collections, brands and Ghanaian artisans used by products and storefront navigation."
      />
      <div className="mb-6 flex overflow-x-auto border-b border-outline-variant">
        {(Object.keys(labels) as Kind[]).map((entry) => (
          <button
            key={entry}
            onClick={() => {
              setKind(entry)
              setQ("")
            }}
            className={`px-5 py-3 text-sm font-semibold ${kind === entry ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            {labels[entry]}
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {query.isLoading ? (
            <LoadingPanel />
          ) : query.isError ? (
            <ErrorPanel
              message={query.error.message}
              retry={() => query.refetch()}
            />
          ) : (
            <>
              <AdminListToolbar
                value={q}
                onChange={setQ}
                placeholder={`Search ${labels[kind].toLowerCase()}`}
              />
              <AdminTable
                rows={rows}
                columns={columns}
                emptyTitle={`No ${labels[kind].toLowerCase()} yet`}
                emptyDescription={`Create the first ${labels[kind].slice(0, -1).toLowerCase()} for the Trendify catalogue.`}
              />
            </>
          )}
        </div>
        <AdminCard className="h-fit p-5">
          <h2 className="font-heading text-xl font-semibold">
            Add {labels[kind].slice(0, -1)}
          </h2>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">
              Name
              <Input
                className="mt-1"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    name: e.target.value,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  }))
                }
              />
            </label>
            <label className="block text-sm font-medium">
              Slug
              <Input
                className="mt-1"
                required
                value={form.slug}
                onChange={(e) =>
                  setForm((current) => ({ ...current, slug: e.target.value }))
                }
              />
            </label>
            {kind === "artisans" && (
              <label className="block text-sm font-medium">
                Ghanaian region
                <Input
                  className="mt-1"
                  value={form.region}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      region: e.target.value,
                    }))
                  }
                />
              </label>
            )}
            <label className="block text-sm font-medium">
              Description
              <textarea
                className="mt-1 min-h-24 w-full border border-outline-variant p-3"
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    featured: e.target.checked,
                  }))
                }
              />
              Feature on storefront
            </label>
            {create.isError && (
              <p className="text-sm text-error">{create.error.message}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={create.isPending}
            >
              {create.isPending
                ? "Saving…"
                : `Create ${labels[kind].slice(0, -1).toLowerCase()}`}
            </Button>
          </form>
        </AdminCard>
      </div>
    </>
  )
}
