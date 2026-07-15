"use client"

import { useState } from "react"
import api from "@/lib/axios"
import type { ApiResponse } from "@/types"
import { useAdminResource } from "@/services/admin/resources"
import {
  AdminCard,
  AdminPageHeader,
  ErrorPanel,
  LoadingPanel,
  StatusBadge,
} from "@/components/admin/admin-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

type Section = {
  id: string
  key: string
  type: string
  status: string
  heading?: string | null
  body?: string | null
  sortOrder: number
  enabled: boolean
}
type Page = {
  id: string
  type: string
  slug: string
  title: string
  excerpt?: string | null
  body: string
  status: string
  updatedAt: string
}
type Category = {
  id: string
  name: string
  slug: string
  active: boolean
  sortOrder: number
}
export function ContentAdmin() {
  const [tab, setTab] = useState<"homepage" | "pages" | "navigation">(
    "homepage"
  )
  const [section, setSection] = useState({
    key: "",
    type: "HERO",
    heading: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
    status: "DRAFT",
    enabled: true,
  })
  const [page, setPage] = useState({
    type: "PAGE",
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    status: "DRAFT",
  })
  const sections = useAdminResource<Section[]>(
    ["homepage-sections"],
    "/admin/homepage/sections"
  )
  const pages = useAdminResource<Page[]>(["content-pages"], "/admin/content")
  const categories = useAdminResource<Category[]>(
    ["categories"],
    "/admin/categories"
  )
  const saveSection = async (event: React.FormEvent) => {
    event.preventDefault()
    const response = await api.post<ApiResponse<unknown>>(
      "/admin/homepage/sections",
      { ...section, sortOrder: sections.data?.length ?? 0 }
    )
    if (response.data.success) {
      setSection({
        key: "",
        type: "HERO",
        heading: "",
        body: "",
        ctaLabel: "",
        ctaHref: "",
        status: "DRAFT",
        enabled: true,
      })
      await sections.refetch()
    }
  }
  const savePage = async (event: React.FormEvent) => {
    event.preventDefault()
    const response = await api.post<ApiResponse<unknown>>(
      "/admin/content",
      page
    )
    if (response.data.success) {
      setPage({
        type: "PAGE",
        slug: "",
        title: "",
        excerpt: "",
        body: "",
        status: "DRAFT",
      })
      await pages.refetch()
    }
  }
  const patchSection = async (item: Section, data: Partial<Section>) => {
    await api.patch(`/admin/homepage/sections/${item.id}`, data)
    await sections.refetch()
  }
  return (
    <>
      <AdminPageHeader
        title="Content and homepage"
        description="Publish the storefront experience from persisted sections, editorial pages and catalogue navigation order."
      />
      <div className="mb-6 flex border-b border-outline-variant">
        {(["homepage", "pages", "navigation"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-5 py-3 text-sm font-semibold capitalize ${tab === value ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            {value === "pages" ? "Content pages" : value}
          </button>
        ))}
      </div>
      {tab === "homepage" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {sections.isLoading ? (
              <LoadingPanel />
            ) : sections.isError ? (
              <ErrorPanel message={sections.error.message} />
            ) : sections.data?.length ? (
              sections.data.map((item) => (
                <AdminCard
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {item.heading || item.key}
                      </p>
                      <StatusBadge
                        tone={
                          item.status === "PUBLISHED" ? "success" : "warning"
                        }
                      >
                        {item.status}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.type.replaceAll("_", " ")} · position{" "}
                      {item.sortOrder + 1} ·{" "}
                      {item.enabled ? "enabled" : "disabled"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        patchSection(item, { enabled: !item.enabled })
                      }
                    >
                      {item.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="xs"
                      onClick={() =>
                        patchSection(item, {
                          status:
                            item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                          publishedAt: new Date().toISOString(),
                        } as Partial<Section>)
                      }
                    >
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </Button>
                  </div>
                </AdminCard>
              ))
            ) : (
              <AdminCard className="p-8 text-center text-sm text-muted-foreground">
                No homepage sections have been configured.
              </AdminCard>
            )}
          </div>
          <AdminCard className="h-fit p-5">
            <h2 className="font-heading text-xl font-semibold">
              Add homepage section
            </h2>
            <form className="mt-5 space-y-3" onSubmit={saveSection}>
              <Input
                required
                placeholder="Unique key"
                value={section.key}
                onChange={(e) =>
                  setSection((current) => ({
                    ...current,
                    key: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-"),
                  }))
                }
              />
              <select
                className="h-11 w-full border border-outline-variant bg-white px-3"
                value={section.type}
                onChange={(e) =>
                  setSection((current) => ({
                    ...current,
                    type: e.target.value,
                  }))
                }
              >
                {[
                  "HERO",
                  "BENEFITS",
                  "CATEGORY_GRID",
                  "COLLECTION_SPOTLIGHT",
                  "PRODUCT_CAROUSEL",
                  "HERITAGE_STORY",
                  "REGIONAL_TRENDS",
                  "NEWSLETTER",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <Input
                placeholder="Heading"
                value={section.heading}
                onChange={(e) =>
                  setSection((current) => ({
                    ...current,
                    heading: e.target.value,
                  }))
                }
              />
              <textarea
                className="min-h-24 w-full border border-outline-variant p-3"
                placeholder="Body copy"
                value={section.body}
                onChange={(e) =>
                  setSection((current) => ({
                    ...current,
                    body: e.target.value,
                  }))
                }
              />
              <Input
                placeholder="Call-to-action label"
                value={section.ctaLabel}
                onChange={(e) =>
                  setSection((current) => ({
                    ...current,
                    ctaLabel: e.target.value,
                  }))
                }
              />
              <Input
                placeholder="Call-to-action link"
                value={section.ctaHref}
                onChange={(e) =>
                  setSection((current) => ({
                    ...current,
                    ctaHref: e.target.value,
                  }))
                }
              />
              <Button type="submit" className="w-full">
                Add as draft
              </Button>
            </form>
          </AdminCard>
        </div>
      )}
      {tab === "pages" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-3">
            {pages.isLoading ? (
              <LoadingPanel />
            ) : pages.data?.length ? (
              pages.data.map((item) => (
                <AdminCard
                  key={item.id}
                  className="flex justify-between gap-4 p-5"
                >
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
              ))
            ) : (
              <AdminCard className="p-8 text-center text-sm text-muted-foreground">
                No content pages yet.
              </AdminCard>
            )}
          </div>
          <AdminCard className="h-fit p-5">
            <h2 className="font-heading text-xl font-semibold">
              Create content page
            </h2>
            <form className="mt-5 space-y-3" onSubmit={savePage}>
              <select
                className="h-11 w-full border border-outline-variant bg-white px-3"
                value={page.type}
                onChange={(e) =>
                  setPage((current) => ({ ...current, type: e.target.value }))
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
                onChange={(e) =>
                  setPage((current) => ({
                    ...current,
                    title: e.target.value,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  }))
                }
              />
              <Input
                required
                placeholder="Slug"
                value={page.slug}
                onChange={(e) =>
                  setPage((current) => ({ ...current, slug: e.target.value }))
                }
              />
              <Input
                placeholder="Excerpt"
                value={page.excerpt}
                onChange={(e) =>
                  setPage((current) => ({
                    ...current,
                    excerpt: e.target.value,
                  }))
                }
              />
              <RichTextEditor
                value={page.body}
                onChange={(value) =>
                  setPage((current) => ({ ...current, body: value }))
                }
              />
              <Button type="submit" className="w-full">
                Save draft page
              </Button>
            </form>
          </AdminCard>
        </div>
      )}
      {tab === "navigation" && (
        <AdminCard className="p-6">
          <h2 className="font-heading text-xl font-semibold">
            Storefront navigation
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Navigation uses the active category ordering below, keeping one
            source of truth for catalogue and menus.
          </p>
          <div className="mt-5 divide-y divide-outline-variant">
            {categories.data?.map((item, index) => (
              <div key={item.id} className="flex justify-between py-4">
                <span>
                  {index + 1}. {item.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{item.slug} · {item.active ? "Visible" : "Hidden"}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </>
  )
}
