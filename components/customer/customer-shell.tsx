"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"
import {
  Heart,
  House,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { signOut, useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const links = [
  [House, "Dashboard", "/account"],
  [Package, "Orders", "/account/orders"],
  [Heart, "Wishlist", "/account/wishlist"],
  [MapPin, "Address book", "/account/addresses"],
  [Settings, "Settings", "/account/settings"],
] as const

export function CustomerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  return (
    <div className="min-h-svh">
      <header className="border-b border-outline-variant">
        <div className="page-shell flex h-18 items-center justify-between">
          <Link href="/" className="font-heading text-xl font-bold">
            Fashion Trendify GH
          </Link>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/cart")}
            >
              <ShoppingBag />
              <span className="sr-only">Shopping bag</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                signOut({ fetchOptions: { onSuccess: () => router.push("/") } })
              }
            >
              <LogOut />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="grid min-h-[calc(100svh-4.5rem)] md:grid-cols-[230px_1fr]">
        <aside className="hidden border-r border-outline-variant bg-surface-container-low p-5 md:block">
          <div className="border-b border-outline-variant pb-6">
            <p className="font-heading text-lg font-semibold">
              Akwaaba,{" "}
              {session?.user.name?.split(" ")[0] || "Customer"}
            </p>
            <p className="text-xs text-muted-foreground">Customer account</p>
          </div>
          <nav className="mt-6 space-y-2">
            {links.map(([Icon, label, href]) => {
              const active =
                href === "/account"
                  ? pathname === href
                  : pathname.startsWith(href)
              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm",
                    active ? "bg-primary text-white" : "hover:bg-white"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-outline-variant bg-surface md:hidden">
        {links.map(([Icon, label, href]) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-1 py-3 text-[0.6rem]",
              pathname === href ||
                (href !== "/account" && pathname.startsWith(href))
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
