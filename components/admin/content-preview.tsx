"use client"

import Link from "next/link"
import { useAdminResource } from "@/services/admin/resources"
import {
  AdminPageHeader,
  ErrorPanel,
  LoadingPanel,
  StatusBadge,
} from "@/components/admin/admin-ui"
import { Button } from "@/components/ui/button"

type Section = {
  id: string
  type: string
  status: string
  eyebrow?: string | null
  heading?: string | null
  body?: string | null
  ctaLabel?: string | null
  enabled: boolean
}

export function ContentPreview() {
  const query = useAdminResource<Section[]>(
    ["homepage-preview"],
    "/admin/homepage/sections"
  )
  if (query.isLoading) return <LoadingPanel />
  if (query.isError) return <ErrorPanel message={query.error.message} />
  return (
    <>
      <AdminPageHeader
        title="Protected homepage preview"
        description="Draft and scheduled sections are shown without exposing them on the public storefront."
        actions={
          <Button variant="outline" render={<Link href="/admin/content" />}>
            Back to content
          </Button>
        }
      />
      <div className="mx-auto max-w-6xl overflow-hidden border border-outline-variant bg-white">
        {query.data
          ?.filter((section) => section.enabled)
          .map((section) => (
            <section
              key={section.id}
              className="border-b border-outline-variant px-6 py-14 text-center last:border-0 md:px-12"
            >
              <div className="mb-4 flex justify-center gap-2">
                <StatusBadge
                  tone={section.status === "PUBLISHED" ? "success" : "warning"}
                >
                  {section.status}
                </StatusBadge>
                <StatusBadge>{section.type.replaceAll("_", " ")}</StatusBadge>
              </div>
              {section.eyebrow && (
                <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  {section.eyebrow}
                </p>
              )}
              <h2 className="mt-2 font-heading text-3xl font-semibold">
                {section.heading || section.type.replaceAll("_", " ")}
              </h2>
              {section.body && (
                <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
                  {section.body}
                </p>
              )}
              {section.ctaLabel && (
                <span className="mt-6 inline-flex bg-primary px-5 py-3 text-sm font-semibold text-white">
                  {section.ctaLabel}
                </span>
              )}
            </section>
          ))}
      </div>
    </>
  )
}
