"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import FileUpload from "@/components/common/FileUpload"
import {
  AdminCard,
  AdminPageHeader,
  ErrorPanel,
  LoadingPanel,
  StatusBadge,
} from "@/components/admin/admin-ui"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import { useAdminResource } from "@/services/admin/resources"
import { CANONICAL_HOMEPAGE_SLOTS } from "@/services/storefront/homepage"

type Section = {
  id: string
  key: string
  type: string
  status: string
  mediaAssetId?: string | null
  mediaAsset?: { secureUrl: string } | null
  eyebrow?: string | null
  heading?: string | null
  body?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  enabled: boolean
  items: Array<{
    title: string
    body?: string | null
    icon?: string | null
    imageUrl?: string | null
    href?: string | null
    sortOrder: number
  }>
  products: Array<{ productId: string }>
  categories: Array<{ categoryId: string }>
  collections: Array<{ collectionId: string }>
}
type ContentPage = {
  id: string
  type: string
  slug: string
  title: string
  excerpt?: string | null
  body: string
  status: string
}
type Named = { id: string; name: string; slug?: string; active?: boolean }

export function ContentAdmin() {
  const [tab, setTab] = useState<"homepage" | "pages" | "navigation">(
    "homepage"
  )
  const sections = useAdminResource<Section[]>(
    ["homepage-sections"],
    "/admin/homepage/sections"
  )
  const pages = useAdminResource<ContentPage[]>(
    ["content-pages"],
    "/admin/content"
  )
  const categories = useAdminResource<Named[]>(
    ["categories"],
    "/admin/categories"
  )
  const products = useAdminResource<Named[]>(
    ["products", "content-links"],
    "/admin/products"
  )
  const collections = useAdminResource<Named[]>(
    ["collections", "content-links"],
    "/admin/collections"
  )
  const initialize = async () => {
    const existing = new Set(sections.data?.map((item) => item.key))
    await Promise.all(
      CANONICAL_HOMEPAGE_SLOTS.filter((slot) => !existing.has(slot.key)).map(
        (slot) =>
          api.post("/admin/homepage/sections", {
            ...slot,
            status: "DRAFT",
            enabled: true,
          })
      )
    )
    await sections.refetch()
    toast.success("Canonical homepage slots are ready")
  }
  return (
    <>
      <AdminPageHeader
        title="Content and homepage"
        description="Edit the fixed Heritage Refined homepage slots and publish storefront pages."
        actions={
          <Button
            variant="outline"
            render={<Link href="/admin/content/preview" />}
          >
            Protected preview
          </Button>
        }
      />
      <div className="mb-6 flex border-b border-outline-variant">
        {(["homepage", "pages", "navigation"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-5 py-3 text-sm font-semibold capitalize ${tab === value ? "border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            {value === "pages" ? "Content pages" : value}
          </button>
        ))}
      </div>
      {tab === "homepage" &&
        (sections.isLoading ? (
          <LoadingPanel />
        ) : sections.isError ? (
          <ErrorPanel message={sections.error.message} />
        ) : (
          <HomepageEditor
            sections={sections.data ?? []}
            products={products.data ?? []}
            categories={categories.data ?? []}
            collections={collections.data ?? []}
            initialize={initialize}
            refresh={() => sections.refetch()}
          />
        ))}
      {tab === "pages" && (
        <PagesEditor pages={pages.data ?? []} refresh={() => pages.refetch()} />
      )}{" "}
      {tab === "navigation" && (
        <AdminCard className="p-6">
          <h2 className="type-headline-md">Storefront navigation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The public menu follows active category ordering.
          </p>
          <div className="mt-5 divide-y divide-outline-variant">
            {categories.data?.map((item, index) => (
              <div key={item.id} className="flex justify-between py-4">
                <span>
                  {index + 1}. {item.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{item.slug} · {item.active === false ? "Hidden" : "Visible"}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </>
  )
}

function HomepageEditor({
  sections,
  products,
  categories,
  collections,
  initialize,
  refresh,
}: {
  sections: Section[]
  products: Named[]
  categories: Named[]
  collections: Named[]
  initialize: () => void
  refresh: () => unknown
}) {
  const [selectedId, setSelectedId] = useState(sections[0]?.id || "")
  const selected =
    sections.find((item) => item.id === selectedId) || sections[0]
  return (
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <div className="space-y-3">
        <Button className="w-full" variant="outline" onClick={initialize}>
          Initialize missing slots
        </Button>
        {CANONICAL_HOMEPAGE_SLOTS.map((slot) => {
          const section = sections.find((item) => item.key === slot.key)
          return (
            <button
              key={slot.key}
              disabled={!section}
              onClick={() => section && setSelectedId(section.id)}
              className={`w-full border p-4 text-left ${selected?.id === section?.id ? "border-primary bg-surface-container" : "border-outline-variant bg-white"} disabled:opacity-50`}
            >
              <span className="font-semibold capitalize">
                {slot.key.replaceAll("-", " ")}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {section
                  ? `${section.status} · ${section.enabled ? "visible" : "hidden"}`
                  : "Not initialized"}
              </span>
            </button>
          )
        })}
      </div>
      {selected ? (
        <SectionForm
          key={selected.id}
          section={selected}
          products={products}
          categories={categories}
          collections={collections}
          refresh={refresh}
        />
      ) : (
        <AdminCard className="p-10 text-center">
          Initialize the canonical homepage slots to begin.
        </AdminCard>
      )}
    </div>
  )
}

function SectionForm({
  section,
  products,
  categories,
  collections,
  refresh,
}: {
  section: Section
  products: Named[]
  categories: Named[]
  collections: Named[]
  refresh: () => unknown
}) {
  const [form, setForm] = useState({
    eyebrow: section.eyebrow || "",
    heading: section.heading || "",
    body: section.body || "",
    ctaLabel: section.ctaLabel || "",
    ctaHref: section.ctaHref || "",
    mediaAssetId: section.mediaAssetId || (null as string | null),
    imageUrl: section.mediaAsset?.secureUrl || "",
    enabled: section.enabled,
    status: section.status,
    productIds: section.products.map((item) => item.productId),
    categoryIds: section.categories.map((item) => item.categoryId),
    collectionIds: section.collections.map((item) => item.collectionId),
    itemsJson: JSON.stringify(section.items, null, 2),
  })
  const [saving, setSaving] = useState(false)
  const set = (
    key: keyof typeof form,
    value: string | boolean | string[] | null
  ) => setForm((current) => ({ ...current, [key]: value }))
  const save = async () => {
    setSaving(true)
    try {
      const items = form.itemsJson.trim() ? JSON.parse(form.itemsJson) : []
      await api.patch(`/admin/homepage/sections/${section.id}`, {
        eyebrow: form.eyebrow || undefined,
        heading: form.heading || undefined,
        body: form.body || undefined,
        ctaLabel: form.ctaLabel || undefined,
        ctaHref: form.ctaHref || undefined,
        mediaAssetId: form.mediaAssetId,
        enabled: form.enabled,
        status: form.status,
        publishedAt:
          form.status === "PUBLISHED" ? new Date().toISOString() : null,
        productIds: form.productIds,
        categoryIds: form.categoryIds,
        collectionIds: form.collectionIds,
        items,
      })
      await refresh()
      toast.success("Homepage content saved")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Homepage content could not be saved"
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <AdminCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="type-label">
            Fixed slot · {section.type.replaceAll("_", " ")}
          </p>
          <h2 className="type-headline-md mt-2 capitalize">
            {section.key.replaceAll("-", " ")}
          </h2>
        </div>
        <StatusBadge tone={form.status === "PUBLISHED" ? "success" : "warning"}>
          {form.status}
        </StatusBadge>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Eyebrow">
          <Input
            value={form.eyebrow}
            onChange={(event) => set("eyebrow", event.target.value)}
          />
        </Field>
        <Field label="Heading">
          <Input
            value={form.heading}
            onChange={(event) => set("heading", event.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Body">
            <textarea
              className="min-h-28 w-full border border-outline-variant p-3"
              value={form.body}
              onChange={(event) => set("body", event.target.value)}
            />
          </Field>
        </div>
        <Field label="CTA label">
          <Input
            value={form.ctaLabel}
            onChange={(event) => set("ctaLabel", event.target.value)}
          />
        </Field>
        <Field label="CTA path">
          <Input
            value={form.ctaHref}
            onChange={(event) => set("ctaHref", event.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Section image">
            <FileUpload
              uploadMode="single"
              uploadToCloudinary
              cloudinaryPurpose="homepageMedia"
              acceptedFileTypes={{
                "image/*": [".png", ".jpg", ".jpeg", ".webp"],
              }}
              onFilesUploaded={(files) => {
                const file = Array.isArray(files) ? files[0] : files
                if (file?.upload) {
                  set("mediaAssetId", file.upload.id)
                  set("imageUrl", file.upload.url)
                }
              }}
            />
            {form.imageUrl && (
              <p className="mt-2 truncate text-xs text-muted-foreground">
                {form.imageUrl}
              </p>
            )}
          </Field>
        </div>
        <Multi
          label="Linked products"
          value={form.productIds}
          items={products}
          onChange={(value) => set("productIds", value)}
        />
        <Multi
          label="Linked categories"
          value={form.categoryIds}
          items={categories}
          onChange={(value) => set("categoryIds", value)}
        />
        <Multi
          label="Linked collections"
          value={form.collectionIds}
          items={collections}
          onChange={(value) => set("collectionIds", value)}
        />
        <div className="sm:col-span-2">
          <Field label="Repeating items (JSON array)">
            <textarea
              className="min-h-48 w-full border border-outline-variant p-3 font-mono text-xs"
              value={form.itemsJson}
              onChange={(event) => set("itemsJson", event.target.value)}
            />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => set("enabled", event.target.checked)}
          />{" "}
          Visible when published
        </label>
        <Field label="Publication">
          <select
            className="h-11 w-full border border-outline-variant bg-white px-3"
            value={form.status}
            onChange={(event) => set("status", event.target.value)}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>
        <Button
          className="sm:col-span-2 sm:w-fit"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save slot content"}
        </Button>
      </div>
    </AdminCard>
  )
}

function PagesEditor({
  pages,
  refresh,
}: {
  pages: ContentPage[]
  refresh: () => unknown
}) {
  const [page, setPage] = useState({
    type: "PAGE",
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    status: "DRAFT",
  })
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-3">
        {pages.map((item) => (
          <AdminCard key={item.id} className="flex justify-between p-5">
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                /{item.slug} · {item.type}
              </p>
            </div>
            <StatusBadge
              tone={item.status === "PUBLISHED" ? "success" : "warning"}
            >
              {item.status}
            </StatusBadge>
          </AdminCard>
        ))}
      </div>
      <AdminCard className="h-fit p-5">
        <h2 className="type-headline-md">Create content page</h2>
        <form
          className="mt-5 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()
            await api.post("/admin/content", page)
            setPage({
              type: "PAGE",
              slug: "",
              title: "",
              excerpt: "",
              body: "",
              status: "DRAFT",
            })
            await refresh()
          }}
        >
          <select
            className="h-11 w-full border border-outline-variant bg-white px-3"
            value={page.type}
            onChange={(event) =>
              setPage((current) => ({ ...current, type: event.target.value }))
            }
          >
            <option>PAGE</option>
            <option>POLICY</option>
            <option>FAQ</option>
          </select>
          <Input
            required
            placeholder="Title"
            value={page.title}
            onChange={(event) => {
              const title = event.target.value
              setPage((current) => ({
                ...current,
                title,
                slug: current.slug
                  ? current.slug
                  : title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
              }))
            }}
          />
          <Input
            required
            placeholder="Slug"
            value={page.slug}
            onChange={(event) =>
              setPage((current) => ({ ...current, slug: event.target.value }))
            }
          />
          <Input
            placeholder="Excerpt"
            value={page.excerpt}
            onChange={(event) =>
              setPage((current) => ({
                ...current,
                excerpt: event.target.value,
              }))
            }
          />
          <RichTextEditor
            value={page.body}
            onChange={(body) => setPage((current) => ({ ...current, body }))}
          />
          <Button type="submit" className="w-full">
            Save draft page
          </Button>
        </form>
      </AdminCard>
    </div>
  )
}

function Multi({
  label,
  value,
  items,
  onChange,
}: {
  label: string
  value: string[]
  items: Named[]
  onChange: (value: string[]) => void
}) {
  return (
    <Field label={label}>
      <select
        multiple
        className="min-h-36 w-full border border-outline-variant bg-white p-2 text-sm"
        value={value}
        onChange={(event) =>
          onChange(
            Array.from(
              event.currentTarget.selectedOptions,
              (option) => option.value
            )
          )
        }
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-muted-foreground">
        Ctrl/Cmd-click to select multiple.
      </p>
    </Field>
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
