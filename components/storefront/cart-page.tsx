"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import { formatPesewas } from "@/lib/utils"
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/services/storefront/storefront"

export function CartPage() {
  const cart = useCart()
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const [code, setCode] = useState("")
  const [promotion, setPromotion] = useState<{ code: string; name: string; discountPesewas: number } | null>(null)
  if (cart.isLoading) return <div className="page-shell min-h-[60vh] animate-pulse py-16"><div className="h-80 bg-surface-container"/></div>
  if (!cart.data?.items.length) return <main className="page-shell grid min-h-[60vh] place-items-center py-16 text-center"><div><h1 className="type-display">Your bag is empty</h1><p className="mt-4 text-muted-foreground">Discover a piece that belongs in your collection.</p><Button className="mt-7" render={<Link href="/shop"/>}>Continue shopping</Button></div></main>
  const subtotal = cart.data.subtotalPesewas
  const discounted = Math.max(0, subtotal - (promotion?.discountPesewas ?? 0))
  return <main className="page-shell py-12 sm:py-16"><h1 className="type-display">Your Shopping Bag</h1><p className="mt-3 text-sm text-muted-foreground">{cart.data.itemCount} {cart.data.itemCount === 1 ? "item" : "items"}</p><div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
    <section className="space-y-4">{cart.data.items.map((line) => { const image = line.variant.product.media[0]; return <article key={line.id} className="grid gap-5 border border-surface-dim bg-white p-4 sm:grid-cols-[140px_1fr_auto] sm:p-5">{image ? <div className="relative aspect-[3/4]"><Image src={image.url} alt={image.altText} fill className="object-cover"/></div> : <div className="aspect-[3/4] bg-surface-container"/>}<div><p className="type-label text-muted-foreground">{line.variant.product.brand?.name || "Trendify GH"}</p><Link href={`/products/${line.variant.product.slug}`} className="mt-2 block font-heading text-xl font-semibold">{line.variant.product.name}</Link><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="bg-surface-container px-3 py-2">{line.variant.colorName || "Default colour"}</span><span className="bg-surface-container px-3 py-2">{line.variant.sizeLabel || "One size"}</span></div><div className="mt-6 flex items-center gap-2"><button aria-label="Decrease quantity" className="grid size-9 place-items-center border border-outline-variant" disabled={line.quantity <= 1 || update.isPending} onClick={() => update.mutate({ itemId: line.id, quantity: line.quantity - 1 })}><Minus className="size-4"/></button><span className="w-8 text-center">{line.quantity}</span><button aria-label="Increase quantity" className="grid size-9 place-items-center border border-outline-variant" disabled={line.quantity >= line.variant.availableQuantity || update.isPending} onClick={() => update.mutate({ itemId: line.id, quantity: line.quantity + 1 }, { onError: (error) => toast.error(error.message) })}><Plus className="size-4"/></button><button aria-label="Remove item" className="ml-3 flex items-center gap-1 text-xs text-error" onClick={() => remove.mutate(line.id)}><Trash2 className="size-4"/> Remove</button></div></div><p className="font-heading text-xl font-semibold">{formatPesewas(line.lineTotalPesewas)}</p></article>})}<Link href="/shop" className="inline-block border-b border-primary pt-5 text-sm">← Continue shopping</Link></section>
    <aside className="h-fit border border-surface-dim bg-surface-container p-6 lg:sticky lg:top-28"><h2 className="type-headline-md">Order Summary</h2><div className="mt-6 space-y-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPesewas(subtotal)}</span></div>{promotion && <div className="flex justify-between text-error"><span>{promotion.code}</span><span>−{formatPesewas(promotion.discountPesewas)}</span></div>}<div className="flex justify-between"><span>Delivery</span><span>Calculated at checkout</span></div><div className="flex justify-between border-t border-outline-variant pt-4 font-heading text-xl font-semibold"><span>Current total</span><span>{formatPesewas(discounted)}</span></div></div><form className="mt-6 flex gap-2" onSubmit={async (event) => { event.preventDefault(); try { const response = await api.post("/storefront/promotions/validate", { code }); if (!response.data.success) throw new Error(response.data.message); setPromotion(response.data.data); sessionStorage.setItem("trendify_promotion_code", code.toUpperCase()); toast.success("Promotion applied") } catch { setPromotion(null); sessionStorage.removeItem("trendify_promotion_code"); toast.error("Promotion is not available") } }}><Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Promo code"/><Button type="submit" variant="outline">Apply</Button></form><Button size="lg" className="mt-7 w-full" render={<Link href="/checkout/delivery"/>}>Proceed to checkout</Button><p className="mt-5 text-center text-xs text-muted-foreground">Delivery and tax are calculated securely by the server.</p></aside>
  </div></main>
}
