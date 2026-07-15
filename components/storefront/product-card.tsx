"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { HeritageMark } from "@/components/brand/heritage-mark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import api from "@/lib/axios"
import { useSession } from "@/lib/auth-client"
import { formatPesewas } from "@/lib/utils"
import { useAddCartItem } from "@/services/storefront/storefront"
import type { ProductListItem } from "@/types/storefront"

export function ProductCard({ product }: { product: ProductListItem }) {
  const { data: session } = useSession()
  const add = useAddCartItem()
  const image = product.media.find((item) => item.primary) || product.media[0]
  const variant = product.variants.find((item) => item.availableQuantity > 0)

  const addToCart = () => {
    if (!variant) return
    add.mutate(
      { variantId: variant.id, quantity: 1 },
      {
        onSuccess: () => toast.success(`${product.name} added to your bag`),
        onError: (error) => toast.error(error.message),
      }
    )
  }

  const save = async () => {
    if (!session) {
      window.location.href = `/login?callbackURL=${encodeURIComponent(`/products/${product.slug}`)}`
      return
    }
    try {
      await api.put(`/customer/wishlist/${product.id}`)
      toast.success("Saved to your wishlist")
    } catch {
      toast.error("This item could not be saved")
    }
  }

  return (
    <article className="group min-w-0">
      <div className="relative mb-4 aspect-[3/4] overflow-hidden border border-surface-dim bg-surface-container-lowest">
        <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
          {image ? (
            <Image
              src={image.url}
              alt={image.altText}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <span className="grid size-full place-items-center text-sm text-muted-foreground">Image coming soon</span>
          )}
        </Link>
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
          {product.madeInGhana ? <Badge variant="gold">Made in Ghana</Badge> : product.newArrival ? <Badge>New arrival</Badge> : <span />}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Save ${product.name} to wishlist`}
            onClick={save}
            className="rounded-full border border-white/50 bg-white/85 text-primary backdrop-blur-sm hover:bg-white"
          >
            <Heart />
          </Button>
        </div>
        <HeritageMark className="absolute right-4 bottom-4 scale-[2.5] text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
        <Button
          type="button"
          disabled={!variant || add.isPending}
          onClick={addToCart}
          className="absolute inset-x-4 bottom-4 hidden translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:inline-flex"
        >
          <ShoppingBag /> {variant ? "Quick add to bag" : "Out of stock"}
        </Button>
      </div>
      <p className="type-label mb-1 truncate text-muted-foreground">
        {product.brand?.name || product.artisan?.name || "Trendify GH"}
      </p>
      <Link href={`/products/${product.slug}`}>
        <h3 className="font-heading text-lg leading-6 font-semibold text-foreground sm:text-xl">{product.name}</h3>
      </Link>
      <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
        <span>{formatPesewas(product.basePricePesewas)}</span>
        {product.compareAtPricePesewas && (
          <span className="font-normal text-muted-foreground line-through">{formatPesewas(product.compareAtPricePesewas)}</span>
        )}
      </div>
    </article>
  )
}
