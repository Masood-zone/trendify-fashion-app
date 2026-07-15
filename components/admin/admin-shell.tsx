"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { authClient } from "@/lib/auth-client"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import type { ApiResponse } from "@/types"

type AdminIdentity = { name: string; email: string; image?: string | null }
type SearchResults = {
  products: Array<{ id: string; label: string; description: string }>
  orders: Array<{ id: string; label: string; description: string }>
  customers: Array<{ id: string; label: string; description: string }>
}

const navigation = [
  ["/admin", "dashboard", "Dashboard"],
  ["/admin/products", "shopping_bag", "Products"],
  ["/admin/categories", "category", "Categories"],
  ["/admin/inventory", "inventory_2", "Inventory"],
  ["/admin/orders", "receipt_long", "Orders"],
  ["/admin/customers", "group", "Customers"],
  ["/admin/payments", "payments", "Payments"],
  ["/admin/discounts", "sell", "Discounts"],
  ["/admin/reviews", "reviews", "Reviews"],
  ["/admin/content", "article", "Content"],
  ["/admin/reports", "analytics", "Reports"],
] as const

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: AdminIdentity
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    if (query.trim().length < 2) {
      return
    }
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.get<ApiResponse<SearchResults>>(
          `/admin/search?q=${encodeURIComponent(query.trim())}`
        )
        setResults(response.data.data ?? null)
        setSearchOpen(true)
      } catch {
        setResults(null)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query])

  async function logout() {
    await authClient.signOut()
    router.replace("/admin/login")
    router.refresh()
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-surface px-0 py-6">
      <Link href="/admin" className="px-6 pb-6">
        <span className="block font-heading text-2xl leading-tight font-bold">
          Fashion Trendify GH
        </span>
        <span className="type-label mt-1 block text-muted-foreground">
          Admin Portal
        </span>
      </Link>
      <nav className="space-y-1" aria-label="Administrator navigation">
        {navigation.map(([href, icon, label]) => {
          const active =
            href === "/admin" ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 border-r-4 border-transparent px-6 py-3 text-sm transition-colors",
                active
                  ? "border-primary bg-secondary-container font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-surface-container-low hover:text-foreground"
              )}
            >
              <MaterialSymbol icon={icon} className="text-xl" filled={active} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-outline-variant pt-4">
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center gap-3 border-r-4 border-transparent px-6 py-3 text-sm",
            pathname.startsWith("/admin/settings")
              ? "border-primary bg-secondary-container font-semibold"
              : "text-muted-foreground hover:bg-surface-container-low"
          )}
        >
          <MaterialSymbol icon="settings" className="text-xl" /> Settings
        </Link>
        <button
          type="button"
          onClick={logout}
          className="hover:bg-error-container flex w-full items-center gap-3 px-6 py-3 text-sm text-error"
        >
          <MaterialSymbol icon="logout" className="text-xl" /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-outline-variant lg:block">
        {sidebar}
      </aside>
      {mobileOpen && (
        <>
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/35 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-outline-variant lg:hidden">
            {sidebar}
          </aside>
        </>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-outline-variant bg-white px-4 md:px-6">
          <button
            type="button"
            className="grid size-10 place-items-center lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <MaterialSymbol icon="menu" />
          </button>
          <div className="relative max-w-xl flex-1">
            <MaterialSymbol
              icon="search"
              className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                if (event.target.value.trim().length < 2) {
                  setResults(null)
                  setSearchOpen(false)
                }
              }}
              onFocus={() => results && setSearchOpen(true)}
              className="h-10 w-full rounded-md border-0 bg-surface-container-low pr-4 pl-10 text-sm outline-none focus:ring-1 focus:ring-primary"
              placeholder="Search products, orders, customers..."
              aria-label="Global administrator search"
            />
            {searchOpen && results && (
              <div className="ambient-shadow absolute top-12 right-0 left-0 max-h-96 overflow-auto border border-outline-variant bg-white p-2">
                {(
                  [
                    ["Products", results.products, "/admin/products/", "/edit"],
                    ["Orders", results.orders, "/admin/orders/", ""],
                    ["Customers", results.customers, "/admin/customers/", ""],
                  ] as const
                ).map(([heading, items, prefix, suffix]) =>
                  items.length ? (
                    <div key={heading} className="py-1">
                      <p className="type-label px-3 py-2 text-muted-foreground">
                        {heading}
                      </p>
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          href={`${prefix}${item.id}${suffix}`}
                          onClick={() => setSearchOpen(false)}
                          className="block px-3 py-2 hover:bg-surface-container-low"
                        >
                          <span className="block text-sm font-semibold">
                            {item.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : null
                )}
                {!results.products.length &&
                  !results.orders.length &&
                  !results.customers.length && (
                    <p className="p-4 text-sm text-muted-foreground">
                      No results found.
                    </p>
                  )}
              </div>
            )}
          </div>
          <Link
            href="/admin/support"
            className="grid size-10 place-items-center text-muted-foreground hover:text-foreground"
            aria-label="Support tickets"
          >
            <MaterialSymbol icon="help_outline" />
          </Link>
          <div className="hidden items-center gap-3 border-l border-outline-variant pl-4 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <div className="grid size-10 place-items-center overflow-hidden rounded-full border border-outline-variant bg-surface-container">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-heading font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
