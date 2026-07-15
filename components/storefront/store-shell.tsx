"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { CircleUserRound, Heart, House, Menu, Search, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { signOut, useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { useCart, useHome } from "@/services/storefront/storefront"

const links = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Made in Ghana", "/shop?madeInGhana=true"],
  ["Collections", "/collections"],
] as const

export function StoreShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const cart = useCart()
  const home = useHome()
  const { data: session } = useSession()
  const settings = home.data?.settings
  const brandName = settings?.brandName || "Fashion Trendify GH"

  return (
    <div className="min-h-svh pb-16 md:pb-0">
      <div className="bg-primary px-4 py-2 text-center text-[0.6875rem] font-semibold tracking-wide text-primary-foreground">
        Proudly celebrating Ghanaian fashion and craftsmanship · Secure Paystack checkout
      </div>
      <header className="sticky top-0 z-50 border-b border-surface-dim bg-surface/95 backdrop-blur-xl">
        <div className="page-shell flex h-18 items-center justify-between gap-5">
          <details className="group relative md:hidden">
            <summary className="flex size-10 list-none items-center justify-center [&::-webkit-details-marker]:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Open navigation</span>
            </summary>
            <nav className="ambient-shadow absolute top-13 -left-1 w-64 border border-surface-dim bg-white p-5">
              {links.map(([label, href]) => (
                <Link key={label} href={href} className="block border-b border-surface-dim py-3 text-sm font-semibold last:border-0">{label}</Link>
              ))}
            </nav>
          </details>
          <Link href="/" className="font-heading text-xl font-bold tracking-tight sm:text-2xl">{brandName}</Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
            {links.map(([label, href]) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0])
              return <Link key={label} href={href} className={cn("pb-1 text-sm font-semibold", active ? "border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>{label}</Link>
            })}
          </nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Search" onClick={() => router.push("/search")}><Search /></Button>
            <Button variant="ghost" size="icon-sm" aria-label="Wishlist" className="hidden sm:inline-flex" onClick={() => router.push(session ? "/account/wishlist" : "/login?callbackURL=/account/wishlist")}><Heart /></Button>
            <Button variant="ghost" size="icon-sm" aria-label="Account" className="hidden sm:inline-flex" onClick={() => router.push(session ? "/account" : "/login")}><CircleUserRound /></Button>
            <Button variant="ghost" size="icon-sm" aria-label="Shopping bag" className="relative" onClick={() => router.push("/cart")}>
              <ShoppingBag />
              {(cart.data?.itemCount ?? 0) > 0 && <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-error text-[0.55rem] text-white">{Math.min(99, cart.data?.itemCount ?? 0)}</span>}
            </Button>
          </div>
        </div>
      </header>
      {children}
      <footer className="bg-primary text-primary-foreground">
        <div className="page-shell grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="font-heading text-2xl font-bold">{brandName}</h2>
            <p className="mt-4 text-sm leading-6 text-primary-fixed-dim">Contemporary Ghanaian fashion, local craftsmanship, and global style rooted in heritage.</p>
          </div>
          <FooterLinks title="Shop" links={[["New arrivals", "/shop?newArrival=true"], ["Made in Ghana", "/shop?madeInGhana=true"], ["Collections", "/collections"]]} />
          <FooterLinks title="Information" links={[["About us", "/about"], ["Contact support", "/support"], ["My orders", "/account/orders"]]} />
          <div>
            <h3 className="type-label mb-4">Support</h3>
            <p className="text-sm text-primary-fixed-dim">{settings?.supportEmail || "Customer care details are being updated."}</p>
            {session && <button className="mt-4 text-sm underline" onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}>Sign out</button>}
          </div>
        </div>
        <div className="border-t border-white/10"><div className="page-shell py-6 text-xs text-primary-fixed-dim">© {new Date().getFullYear()} {brandName}. Made in Ghana with pride.</div></div>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-surface-dim bg-surface/95 px-2 py-2 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {[[House, "Home", "/"], [Search, "Shop", "/shop"], [Heart, "Wishlist", session ? "/account/wishlist" : "/login"], [CircleUserRound, "Account", session ? "/account" : "/login"]].map(([Icon, label, href]) => {
          const NavIcon = Icon as typeof House
          return <Link key={label as string} href={href as string} className="flex flex-col items-center gap-1 py-1 text-[0.625rem] font-semibold text-muted-foreground"><NavIcon className="size-4" />{label as string}</Link>
        })}
      </nav>
    </div>
  )
}

function FooterLinks({ title, links }: { title: string; links: Array<[string, string]> }) {
  return <div><h3 className="type-label mb-4">{title}</h3><ul className="space-y-3 text-sm text-primary-fixed-dim">{links.map(([label, href]) => <li key={label}><Link href={href} className="hover:text-white">{label}</Link></li>)}</ul></div>
}
