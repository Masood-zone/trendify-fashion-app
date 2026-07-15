"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api from "@/lib/axios"
import type { ApiResponse } from "@/types"
import { formatDate, formatPesewas } from "@/lib/utils"
import { useAdminMutation, useAdminResource } from "@/services/admin/resources"
import {
  AdminColumn,
  AdminListToolbar,
  AdminTable,
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
import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import FileUpload from "@/components/common/FileUpload"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

type Variant = {
  id?: string
  sku: string
  sizeLabel?: string | null
  colorName?: string | null
  colorHex?: string | null
  pricePesewas: number
  stockQuantity: number
  reservedQuantity?: number
  lowStockThreshold: number
  active: boolean
}
type Product = {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string | null
  status: string
  audience?: string | null
  basePricePesewas: number
  compareAtPricePesewas?: number | null
  costPricePesewas?: number | null
  brandId?: string | null
  artisanId?: string | null
  featured: boolean
  newArrival: boolean
  madeInGhana: boolean
  publishedAt?: string | null
  createdAt: string
  deletedAt?: string | null
  variants: Variant[]
  categories: Array<{ categoryId: string; category: { name: string } }>
  media: Array<{
    mediaAssetId: string
    altText?: string | null
    sortOrder: number
    primary: boolean
    mediaAsset: { secureUrl: string }
  }>
}
type Named = { id: string; name: string }

function stockOf(product: Product) {
  return product.variants.reduce(
    (sum, item) =>
      sum + Math.max(0, item.stockQuantity - (item.reservedQuantity ?? 0)),
    0
  )
}
function stateOf(product: Product) {
  if (product.deletedAt) return "Archived"
  const stock = stockOf(product)
  if (!stock) return "Out of Stock"
  if (product.variants.some((item) => stock <= item.lowStockThreshold))
    return "Low Stock"
  if (product.status === "DRAFT") return "Draft"
  if (product.publishedAt && new Date(product.publishedAt) > new Date())
    return "Scheduled"
  return "Active"
}

export function ProductsAdmin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const [status, setStatus] = useState(searchParams.get("status") ?? "ALL")
  const [category, setCategory] = useState(
    searchParams.get("category") ?? "ALL"
  )
  const [sort, setSort] = useState(searchParams.get("sort") ?? "created-desc")
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("pageSize") ?? 10)
  )
  const [page, setPage] = useState(
    Math.max(1, Number(searchParams.get("page") ?? 1))
  )
  const [selected, setSelected] = useState<string[]>([])
  const [recentCutoff] = useState(() => Date.now() - 30 * 86400000)
  const query = useAdminResource<Product[]>(
    ["products", "all"],
    "/admin/products?includeArchived=true"
  )
  const categories = useAdminResource<Named[]>(
    ["categories", "product-filter"],
    "/admin/categories"
  )
  const archive = useAdminMutation<{ productIds: string[] }>({
    method: "post",
    path: "/admin/products/bulk-archive",
    invalidate: [["products"]],
  })
  const restore = useAdminMutation<{ id: string }>({
    method: "post",
    path: (payload) => `/admin/products/${payload.id}/restore`,
    invalidate: [["products"]],
  })
  const rows = useMemo(
    () =>
      (query.data ?? [])
        .filter(
          (item) =>
            item.name.toLowerCase().includes(q.toLowerCase()) &&
            (status === "ALL" ||
              stateOf(item).toUpperCase().replaceAll(" ", "_") === status) &&
            (category === "ALL" ||
              item.categories.some((entry) => entry.categoryId === category))
        )
        .sort((a, b) => {
          if (sort === "name-asc") return a.name.localeCompare(b.name)
          if (sort === "price-asc")
            return a.basePricePesewas - b.basePricePesewas
          if (sort === "price-desc")
            return b.basePricePesewas - a.basePricePesewas
          if (sort === "stock-asc") return stockOf(a) - stockOf(b)
          if (sort === "stock-desc") return stockOf(b) - stockOf(a)
          return sort === "created-asc"
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }),
    [category, q, query.data, sort, status]
  )
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const updateUrl = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates))
      params.set(key, String(value))
    router.replace(`/admin/products?${params.toString()}`, { scroll: false })
  }
  if (query.isLoading) return <LoadingPanel />
  if (query.isError)
    return (
      <ErrorPanel message={query.error.message} retry={() => query.refetch()} />
    )
  const inventoryValue = rows.reduce(
    (sum, item) =>
      sum +
      item.variants.reduce(
        (value, variant) =>
          value + variant.stockQuantity * (item.costPricePesewas ?? 0),
        0
      ),
    0
  )
  const columns: AdminColumn<Product>[] = [
    {
      label: "",
      render: (row) => (
        <input
          type="checkbox"
          aria-label={`Select ${row.name}`}
          checked={selected.includes(row.id)}
          onChange={(event) =>
            setSelected((current) =>
              event.target.checked
                ? [...current, row.id]
                : current.filter((id) => id !== row.id)
            )
          }
        />
      ),
    },
    {
      label: "Product",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.media[0] ? (
            // Cloudinary supplies the optimized administrator thumbnail.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.media[0].mediaAsset.secureUrl}
              alt=""
              className="size-12 object-cover"
            />
          ) : (
            <span className="grid size-12 place-items-center bg-surface-container-low">
              <MaterialSymbol icon="image" />
            </span>
          )}
          <div>
            <Link
              href={`/admin/products/${row.id}/edit`}
              className="font-semibold hover:underline"
            >
              {row.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {row.categories[0]?.category.name ?? "Uncategorized"}
            </p>
          </div>
        </div>
      ),
    },
    { label: "SKU", render: (row) => row.variants[0]?.sku ?? "—" },
    { label: "Price", render: (row) => formatPesewas(row.basePricePesewas) },
    { label: "Available", render: (row) => stockOf(row) },
    {
      label: "Status",
      render: (row) => (
        <StatusBadge
          tone={
            stateOf(row) === "Active"
              ? "success"
              : stateOf(row).includes("Stock")
                ? "danger"
                : "warning"
          }
        >
          {stateOf(row)}
        </StatusBadge>
      ),
    },
    { label: "Created", render: (row) => formatDate(row.createdAt) },
    {
      label: "",
      render: (row) =>
        row.deletedAt ? (
          <Button
            size="xs"
            variant="outline"
            onClick={() => restore.mutate({ id: row.id })}
          >
            Restore
          </Button>
        ) : (
          <Button
            size="xs"
            variant="ghost"
            render={<Link href={`/admin/products/${row.id}/edit`} />}
          >
            Edit
          </Button>
        ),
    },
  ]
  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Manage every product, price, image and variant published by Trendify GH."
        actions={
          <>
            <Button
              variant="outline"
              render={<Link href="/api/admin/products/export" />}
            >
              <MaterialSymbol icon="download" />
              Export CSV
            </Button>
            <Button render={<Link href="/admin/products/new" />}>
              <MaterialSymbol icon="add" />
              Add product
            </Button>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Products shown"
          value={String(rows.length)}
          icon="apparel"
        />
        <MetricCard
          label="Inventory value"
          value={formatPesewas(inventoryValue)}
          icon="payments"
        />
        <MetricCard
          label="Low stock"
          value={String(
            rows.filter((item) => stateOf(item) === "Low Stock").length
          )}
          icon="warning"
          danger
        />
        <MetricCard
          label="New in 30 days"
          value={String(
            rows.filter(
              (item) => new Date(item.createdAt).getTime() >= recentCutoff
            ).length
          )}
          icon="new_releases"
        />
      </div>
      <AdminListToolbar
        value={q}
        onChange={(value) => {
          setQ(value)
          setPage(1)
          updateUrl({ q: value, page: 1 })
        }}
        placeholder="Search products"
        secondary={
          <>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
                updateUrl({ status: event.target.value, page: 1 })
              }}
              className="h-11 border border-outline-variant bg-white px-3 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="LOW_STOCK">Low stock</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value)
                setPage(1)
                updateUrl({ category: event.target.value, page: 1 })
              }}
              className="h-11 border border-outline-variant bg-white px-3 text-sm"
            >
              <option value="ALL">All categories</option>
              {categories.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                updateUrl({ sort: event.target.value })
              }}
              className="h-11 border border-outline-variant bg-white px-3 text-sm"
            >
              <option value="created-desc">Newest</option>
              <option value="created-asc">Oldest</option>
              <option value="name-asc">Name A-Z</option>
              <option value="price-asc">Price low-high</option>
              <option value="price-desc">Price high-low</option>
              <option value="stock-asc">Stock low-high</option>
              <option value="stock-desc">Stock high-low</option>
            </select>
            {selected.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm(`Archive ${selected.length} selected products?`))
                    archive.mutate({ productIds: selected })
                }}
              >
                Archive {selected.length}
              </Button>
            )}
          </>
        }
      />
      <AdminTable
        rows={pageRows}
        columns={columns}
        emptyTitle="No products found"
        emptyDescription="Create a draft product or adjust the current filters."
        emptyAction={{ href: "/admin/products/new", label: "Add product" }}
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Showing {rows.length ? (currentPage - 1) * pageSize + 1 : 0}–
          {Math.min(currentPage * pageSize, rows.length)} of {rows.length}
        </span>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(event) => {
              const value = Number(event.target.value)
              setPageSize(value)
              setPage(1)
              updateUrl({ pageSize: value, page: 1 })
            }}
            className="h-9 border border-outline-variant bg-white px-2"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
          <Button
            size="xs"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => {
              setPage(currentPage - 1)
              updateUrl({ page: currentPage - 1 })
            }}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            size="xs"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => {
              setPage(currentPage + 1)
              updateUrl({ page: currentPage + 1 })
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  )
}

const blankVariant: Variant = {
  sku: "",
  sizeLabel: "",
  colorName: "",
  colorHex: "#000000",
  pricePesewas: 0,
  stockQuantity: 0,
  lowStockThreshold: 5,
  active: true,
}
export function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter()
  const productQuery = useAdminResource<Product>(
    ["product", productId],
    productId ? `/admin/products/${productId}` : "",
    Boolean(productId)
  )
  const categories = useAdminResource<Named[]>(
    ["categories"],
    "/admin/categories"
  )
  const brands = useAdminResource<Named[]>(["brands"], "/admin/brands")
  const artisans = useAdminResource<Named[]>(["artisans"], "/admin/artisans")
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    audience: "",
    brandId: "",
    artisanId: "",
    categoryId: "",
    regular: "",
    sale: "",
    cost: "",
    status: "DRAFT",
    publishAt: "",
    featured: false,
    newArrival: false,
    madeInGhana: true,
    seoTitle: "",
    seoDescription: "",
  })
  const [variants, setVariants] = useState<Variant[]>([{ ...blankVariant }])
  const [media, setMedia] = useState<
    Array<{
      mediaAssetId: string
      url: string
      altText: string
      primary: boolean
    }>
  >([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  if (productId && productQuery.data && !loaded) {
    const item = productQuery.data
    setLoaded(true)
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description,
      shortDescription: item.shortDescription ?? "",
      audience: item.audience ?? "",
      brandId: item.brandId ?? "",
      artisanId: item.artisanId ?? "",
      categoryId: item.categories[0]?.categoryId ?? "",
      regular: String(
        (item.compareAtPricePesewas ?? item.basePricePesewas) / 100
      ),
      sale: item.compareAtPricePesewas
        ? String(item.basePricePesewas / 100)
        : "",
      cost:
        item.costPricePesewas == null
          ? ""
          : String(item.costPricePesewas / 100),
      status: item.status,
      publishAt: item.publishedAt
        ? new Date(item.publishedAt).toISOString().slice(0, 16)
        : "",
      featured: item.featured,
      newArrival: item.newArrival,
      madeInGhana: item.madeInGhana,
      seoTitle: "",
      seoDescription: "",
    })
    setVariants(item.variants.length ? item.variants : [{ ...blankVariant }])
    setMedia(
      item.media.map((entry) => ({
        mediaAssetId: entry.mediaAssetId,
        url: entry.mediaAsset.secureUrl,
        altText: entry.altText ?? "",
        primary: entry.primary,
      }))
    )
  }
  if (productId && productQuery.isLoading) return <LoadingPanel />
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }))
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    const regular = Math.round(Number(form.regular || 0) * 100)
    const sale = form.sale ? Math.round(Number(form.sale) * 100) : null
    const payload = {
      name: form.name,
      slug:
        form.slug ||
        form.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      description: form.description,
      shortDescription: form.shortDescription || undefined,
      audience: form.audience || null,
      brandId: form.brandId || null,
      artisanId: form.artisanId || null,
      categoryIds: form.categoryId ? [form.categoryId] : [],
      basePricePesewas: sale ?? regular,
      compareAtPricePesewas: sale ? regular : null,
      costPricePesewas: form.cost ? Math.round(Number(form.cost) * 100) : null,
      status: form.status,
      publishedAt: form.publishAt
        ? new Date(form.publishAt)
        : form.status === "ACTIVE"
          ? new Date()
          : null,
      featured: form.featured,
      newArrival: form.newArrival,
      madeInGhana: form.madeInGhana,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      media: media.map((item, index) => ({
        mediaAssetId: item.mediaAssetId,
        altText: item.altText,
        sortOrder: index,
        primary: item.primary,
      })),
      ...(!productId || !productQuery.data?.variants.length
        ? {
            variants: variants.map((item) => ({
              ...item,
              pricePesewas: sale ?? regular,
            })),
          }
        : {}),
    }
    try {
      const response = await api.request<ApiResponse<{ id: string }>>({
        method: productId ? "patch" : "post",
        url: productId ? `/admin/products/${productId}` : "/admin/products",
        data: payload,
      })
      if (!response.data.success || !response.data.data)
        throw new Error(response.data.message)
      router.push("/admin/products")
      router.refresh()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Product could not be saved"
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <form onSubmit={save}>
      <AdminPageHeader
        title={productId ? "Edit product" : "Add product"}
        description="Drafts can be saved with a name. Publishing checks catalogue, pricing, media and variant requirements."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              render={<Link href="/admin/products" />}
            >
              Cancel
            </Button>
            {productId && (
              <Button
                type="button"
                variant="outline"
                render={<Link href={`/admin/products/${productId}/preview`} />}
              >
                Preview
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save product"}
            </Button>
          </>
        }
      />
      {message && (
        <p className="bg-error-container mb-5 border border-error/30 p-3 text-sm text-error">
          {message}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <AdminCard className="space-y-5 p-6">
            <h2 className="font-heading text-xl font-semibold">
              Basic information
            </h2>
            <Field label="Product name">
              <Input
                required
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value)
                  if (!productId)
                    set(
                      "slug",
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")
                    )
                }}
              />
            </Field>
            <Field label="Publish or schedule at">
              <Input
                type="datetime-local"
                value={form.publishAt}
                onChange={(e) => set("publishAt", e.target.value)}
              />
            </Field>
            <Field label="Slug">
              <Input
                required
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </Field>
            <Field label="Short description">
              <Input
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
              />
            </Field>
            <Field label="Description">
              <RichTextEditor
                value={form.description}
                onChange={(value) => set("description", value)}
              />
            </Field>
          </AdminCard>
          <AdminCard className="space-y-5 p-6">
            <h2 className="font-heading text-xl font-semibold">
              Product media
            </h2>
            <FileUpload
              uploadMode="multi"
              uploadToCloudinary
              cloudinaryPurpose="productImage"
              acceptedFileTypes={{
                "image/*": [".png", ".jpg", ".jpeg", ".webp"],
              }}
              otherText="PNG, JPG or WEBP up to 20MB"
              onFilesUploaded={(files) => {
                const list = Array.isArray(files) ? files : files ? [files] : []
                setMedia((current) => [
                  ...current,
                  ...list
                    .filter((file) => file.upload)
                    .map((file) => ({
                      mediaAssetId: file.upload!.id,
                      url: file.upload!.url,
                      altText: form.name,
                      primary: current.length === 0,
                    })),
                ])
              }}
            />
            {media.map((item, index) => (
              <div
                key={item.mediaAssetId}
                className="flex items-center gap-3 border border-outline-variant p-3"
              >
                {/* Cloudinary supplies the editor preview URL immediately after upload. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" className="size-16 object-cover" />
                <Input
                  value={item.altText}
                  onChange={(e) =>
                    setMedia((current) =>
                      current.map((entry, i) =>
                        i === index
                          ? { ...entry, altText: e.target.value }
                          : entry
                      )
                    )
                  }
                  placeholder="Alt text"
                />
                <Button
                  type="button"
                  size="xs"
                  variant={item.primary ? "secondary" : "outline"}
                  onClick={() =>
                    setMedia((current) =>
                      current.map((entry, i) => ({
                        ...entry,
                        primary: i === index,
                      }))
                    )
                  }
                >
                  {item.primary ? "Primary" : "Make primary"}
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() =>
                    setMedia((current) => current.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </AdminCard>
          <AdminCard className="space-y-4 p-6">
            <div className="flex justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold">Variants</h2>
                <p className="text-sm text-muted-foreground">
                  Stock changes for saved variants are recorded in Inventory.
                </p>
              </div>
              {!productId && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setVariants((current) => [...current, { ...blankVariant }])
                  }
                >
                  Add variant
                </Button>
              )}
            </div>
            {variants.map((variant, index) => (
              <div
                key={variant.id ?? index}
                className="grid gap-3 border border-outline-variant p-4 md:grid-cols-5"
              >
                <Input
                  placeholder="SKU"
                  disabled={Boolean(productId && variant.id)}
                  value={variant.sku}
                  onChange={(e) =>
                    setVariants((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, sku: e.target.value } : item
                      )
                    )
                  }
                />
                <Input
                  placeholder="Size"
                  disabled={Boolean(productId && variant.id)}
                  value={variant.sizeLabel ?? ""}
                  onChange={(e) =>
                    setVariants((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, sizeLabel: e.target.value }
                          : item
                      )
                    )
                  }
                />
                <Input
                  placeholder="Colour"
                  disabled={Boolean(productId && variant.id)}
                  value={variant.colorName ?? ""}
                  onChange={(e) =>
                    setVariants((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, colorName: e.target.value }
                          : item
                      )
                    )
                  }
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Initial stock"
                  disabled={Boolean(productId && variant.id)}
                  value={variant.stockQuantity}
                  onChange={(e) =>
                    setVariants((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, stockQuantity: Number(e.target.value) }
                          : item
                      )
                    )
                  }
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Low threshold"
                  disabled={Boolean(productId && variant.id)}
                  value={variant.lowStockThreshold}
                  onChange={(e) =>
                    setVariants((current) =>
                      current.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              lowStockThreshold: Number(e.target.value),
                            }
                          : item
                      )
                    )
                  }
                />
              </div>
            ))}
          </AdminCard>
        </div>
        <aside className="space-y-6">
          <AdminCard className="space-y-4 p-5">
            <h2 className="font-heading text-lg font-semibold">Publishing</h2>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="h-11 w-full border border-outline-variant bg-white px-3"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>
            <Check
              label="Featured"
              checked={form.featured}
              onChange={(value) => set("featured", value)}
            />
            <Check
              label="New arrival"
              checked={form.newArrival}
              onChange={(value) => set("newArrival", value)}
            />
            <Check
              label="Made in Ghana"
              checked={form.madeInGhana}
              onChange={(value) => set("madeInGhana", value)}
            />
          </AdminCard>
          <AdminCard className="space-y-4 p-5">
            <h2 className="font-heading text-lg font-semibold">Organization</h2>
            <Field label="Audience">
              <select
                value={form.audience}
                onChange={(e) => set("audience", e.target.value)}
                className="h-11 w-full border border-outline-variant bg-white px-3"
              >
                <option value="">Select audience</option>
                <option>MEN</option>
                <option>WOMEN</option>
                <option>UNISEX</option>
              </select>
            </Field>
            <SelectNamed
              label="Category"
              value={form.categoryId}
              items={categories.data ?? []}
              onChange={(value) => set("categoryId", value)}
            />
            <SelectNamed
              label="Brand"
              value={form.brandId}
              items={brands.data ?? []}
              onChange={(value) => set("brandId", value)}
            />
            <SelectNamed
              label="Artisan"
              value={form.artisanId}
              items={artisans.data ?? []}
              onChange={(value) => set("artisanId", value)}
            />
          </AdminCard>
          <AdminCard className="space-y-4 p-5">
            <h2 className="font-heading text-lg font-semibold">
              Pricing (GHS)
            </h2>
            <Field label="Regular price">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.regular}
                onChange={(e) => set("regular", e.target.value)}
              />
            </Field>
            <Field label="Sale price">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.sale}
                onChange={(e) => set("sale", e.target.value)}
              />
            </Field>
            <Field label="Cost price">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
              />
            </Field>
          </AdminCard>
        </aside>
      </div>
    </form>
  )
}

export function ProductPreview({ productId }: { productId: string }) {
  const query = useAdminResource<Product>(
    ["product-preview", productId],
    `/admin/products/${productId}`
  )
  if (query.isLoading) return <LoadingPanel />
  if (query.isError || !query.data)
    return <ErrorPanel message={query.error?.message ?? "Product not found"} />
  const product = query.data
  return (
    <>
      <AdminPageHeader
        title="Protected product preview"
        description="Draft and scheduled products remain visible only inside the administrator session."
        actions={
          <Button
            variant="outline"
            render={<Link href={`/admin/products/${product.id}/edit`} />}
          >
            Back to editor
          </Button>
        }
      />
      <div className="mx-auto grid max-w-5xl gap-8 bg-white p-6 md:grid-cols-2">
        {product.media[0] ? (
          <div className="aspect-[4/5] bg-surface-container-low">
            {/* Cloudinary preview for administrator review. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.media[0].mediaAsset.secureUrl}
              alt={product.media[0].altText ?? product.name}
              className="size-full object-cover"
            />
          </div>
        ) : (
          <div className="grid aspect-[4/5] place-items-center bg-surface-container-low">
            <MaterialSymbol
              icon="image"
              className="text-6xl text-muted-foreground"
            />
          </div>
        )}
        <div className="py-4">
          <StatusBadge
            tone={stateOf(product) === "Active" ? "success" : "warning"}
          >
            {stateOf(product)}
          </StatusBadge>
          <p className="mt-6 text-xs tracking-[0.2em] text-muted-foreground uppercase">
            {product.categories[0]?.category.name ?? "Trendify GH"}
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">
            {product.name}
          </h1>
          <p className="mt-5 font-heading text-2xl">
            {formatPesewas(product.basePricePesewas)}
          </p>
          <div
            className="prose mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <div className="mt-8 flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <span
                key={variant.id ?? variant.sku}
                className="border border-outline-variant px-3 py-2 text-sm"
              >
                {variant.sizeLabel || "One size"} ·{" "}
                {variant.colorName || "Default"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
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
function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}
function SelectNamed({
  label,
  value,
  items,
  onChange,
}: {
  label: string
  value: string
  items: Named[]
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full border border-outline-variant bg-white px-3"
      >
        <option value="">None</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </Field>
  )
}
