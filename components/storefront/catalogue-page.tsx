"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, Search } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCategories, useProducts } from "@/services/storefront/storefront"

export function CataloguePage({
  title = "New Collections",
  initialCollection,
  searchMode = false,
}: {
  title?: string
  initialCollection?: string
  searchMode?: boolean
}) {
  const router = useRouter()
  const current = useSearchParams()
  const [mobileFilters, setMobileFilters] = useState(false)
  const [query, setQuery] = useState(current.get("q") ?? "")
  const params = useMemo(() => {
    const next = new URLSearchParams(current.toString())
    if (initialCollection) next.set("collection", initialCollection)
    return `?${next.toString()}`
  }, [current, initialCollection])
  const products = useProducts(params)
  const categories = useCategories()
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(current.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== "page") next.delete("page")
    router.replace(`${searchMode ? "/search" : "/shop"}?${next.toString()}`, {
      scroll: false,
    })
  }
  return (
    <main className="page-shell py-10 sm:py-16">
      <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="type-label text-on-tertiary-container">
            Curated in Ghana
          </p>
          <h1 className="type-display mt-2">
            {searchMode
              ? current.get("q")
                ? `Results for “${current.get("q")}”`
                : "Search"
              : title}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Discover contemporary heritage pieces from Ghanaian brands and
            artisans.
          </p>
        </div>
        {searchMode && (
          <form
            className="flex max-w-md gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              set("q", query)
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
            />
            <Button type="submit" aria-label="Search">
              <Search />
            </Button>
          </form>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="lg:hidden"
            onClick={() => setMobileFilters((value) => !value)}
          >
            <Filter /> Filters
          </Button>
          <select
            aria-label="Sort products"
            className="h-11 border border-outline-variant bg-white px-3 text-sm"
            value={current.get("sort") ?? "newest"}
            onChange={(event) => set("sort", event.target.value)}
          >
            <option value="newest">Newest arrivals</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name-asc">Name A–Z</option>
          </select>
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside
          className={`${mobileFilters ? "block" : "hidden"} space-y-7 border-t border-surface-dim pt-6 lg:block`}
        >
          <FilterSelect
            label="Category"
            value={current.get("category") ?? ""}
            onChange={(value) => set("category", value)}
            options={(categories.data ?? []).map((item) => [
              item.slug,
              item.name,
            ])}
          />
          <FilterSelect
            label="Brand"
            value={current.get("brand") ?? ""}
            onChange={(value) => set("brand", value)}
            options={(products.data?.facets.brands ?? []).map((item) => [
              item.slug,
              item.name,
            ])}
          />
          <FilterSelect
            label="Audience"
            value={current.get("audience") ?? ""}
            onChange={(value) => set("audience", value)}
            options={[
              ["WOMEN", "Women"],
              ["MEN", "Men"],
              ["UNISEX", "Unisex"],
            ]}
          />
          <FilterSelect
            label="Size"
            value={current.get("size") ?? ""}
            onChange={(value) => set("size", value)}
            options={(products.data?.facets.sizes ?? []).map((item) => [
              item,
              item,
            ])}
          />
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={current.get("madeInGhana") === "true"}
              onChange={(event) =>
                set("madeInGhana", event.target.checked ? "true" : "")
              }
            />{" "}
            Made in Ghana
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={current.get("available") === "true"}
              onChange={(event) =>
                set("available", event.target.checked ? "true" : "")
              }
            />{" "}
            In stock only
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace(searchMode ? "/search" : "/shop")}
          >
            Clear filters
          </Button>
        </aside>
        <section>
          {products.isLoading ? (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] animate-pulse bg-surface-container"
                />
              ))}
            </div>
          ) : products.isError ? (
            <button
              className="border border-error p-6 text-error"
              onClick={() => products.refetch()}
            >
              Products could not be loaded. Try again.
            </button>
          ) : products.data?.items.length ? (
            <>
              <p className="mb-5 text-sm text-muted-foreground">
                {products.data.total} pieces
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 xl:grid-cols-3">
                {products.data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-12 flex justify-center gap-2">
                {Array.from(
                  { length: products.data.pageCount },
                  (_, index) => index + 1
                )
                  .slice(0, 8)
                  .map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={
                        products.data?.page === page ? "default" : "outline"
                      }
                      onClick={() => set("page", String(page))}
                    >
                      {page}
                    </Button>
                  ))}
              </div>
            </>
          ) : (
            <div className="border border-dashed border-surface-dim p-12 text-center">
              <h2 className="type-headline-md">No matching pieces</h2>
              <p className="mt-2 text-muted-foreground">
                Try clearing one or more filters.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<readonly [string, string]>
}) {
  return (
    <label className="block">
      <span className="type-label mb-2 block">{label}</span>
      <select
        className="h-11 w-full border border-outline-variant bg-white px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All {label.toLowerCase()}s</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}
