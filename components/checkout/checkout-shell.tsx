import Link from "next/link"
import type { ReactNode } from "react"
import { Lock, ShoppingBag } from "lucide-react"

export function CheckoutShell({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-surface"><header className="border-b border-outline-variant"><div className="page-shell flex h-20 items-center justify-between"><Link href="/" className="font-heading text-2xl font-bold">Fashion Trendify GH</Link><Link href="/cart" className="flex items-center gap-2 text-sm"><ShoppingBag className="size-4"/> Back to bag</Link></div></header>{children}<footer className="mt-20 bg-primary text-primary-foreground"><div className="page-shell flex flex-col gap-3 py-8 text-xs sm:flex-row sm:justify-between"><p>© {new Date().getFullYear()} Fashion Trendify GH.</p><p className="flex items-center gap-2"><Lock className="size-3"/> Secure checkout powered by Paystack</p></div></footer></div>
}

export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return <div className="mb-10 flex items-center justify-center gap-3 sm:gap-6" aria-label={`Checkout step ${current} of 3`}>{[[1, "Contact & Delivery"], [2, "Review"], [3, "Payment"]].map(([number, label], index) => <div key={number as number} className="contents"><div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${(number as number) <= current ? "text-primary" : "text-muted-foreground"}`}><span className={`grid size-8 place-items-center rounded-full border ${(number as number) === current ? "border-primary bg-primary text-white" : "border-outline-variant"}`}>{number}</span><span className="hidden sm:inline">{label}</span></div>{index < 2 && <span className="h-px w-10 bg-outline-variant sm:w-24"/>}</div>)}</div>
}
