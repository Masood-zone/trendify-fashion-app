"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Check,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react"
import { toast } from "sonner"

import { ProductCard } from "@/components/storefront/product-card"
import { Button } from "@/components/ui/button"
import api from "@/lib/axios"
import { useSession } from "@/lib/auth-client"
import { formatPesewas } from "@/lib/utils"
import { useAddCartItem, useProduct } from "@/services/storefront/storefront"

export function ProductDetailPage({ slug }: { slug: string }) {
  const product = useProduct(slug)
  const add = useAddCartItem()
  const { data: session } = useSession()
  const [selectedVariant, setSelectedVariant] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [imageIndex, setImageIndex] = useState(0)
  const [tab, setTab] = useState<"materials" | "size" | "reviews">("materials")
  const selected = useMemo(
    () =>
      product.data?.variants.find((item) => item.id === selectedVariant) ||
      product.data?.variants.find((item) => item.availableQuantity > 0),
    [product.data, selectedVariant]
  )
  if (product.isLoading)
    return (
      <div className="page-shell min-h-[60vh] animate-pulse py-16">
        <div className="h-[36rem] bg-surface-container" />
      </div>
    )
  if (product.isError || !product.data)
    return (
      <div className="page-shell grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <h1 className="type-headline-lg">Product unavailable</h1>
          <Link href="/shop" className="mt-4 inline-block underline">
            Return to the shop
          </Link>
        </div>
      </div>
    )
  const item = product.data
  const image = item.media[imageIndex] || item.media[0]
  const addItem = (buyNow = false) => {
    if (!selected) return toast.error("Choose an available option")
    add.mutate(
      { variantId: selected.id, quantity },
      {
        onSuccess: () => {
          toast.success("Added to your bag")
          if (buyNow) window.location.href = "/cart"
        },
        onError: (error) => toast.error(error.message),
      }
    )
  }
  const save = async () => {
    if (!session)
      return void (window.location.href = `/login?callbackURL=${encodeURIComponent(`/products/${slug}`)}`)
    try {
      await api.put(`/customer/wishlist/${item.id}`)
      toast.success("Saved to your wishlist")
    } catch {
      toast.error("Could not save this piece")
    }
  }
  return (
    <main className="page-shell py-10 sm:py-16">
      <nav className="mb-8 text-xs text-muted-foreground">
        Shop / {item.categories[0]?.name || "Collection"} / {item.name}
      </nav>
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-[76px_1fr]">
          <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
            {item.media.map((media, index) => (
              <button
                key={media.id}
                onClick={() => setImageIndex(index)}
                className={`relative aspect-[3/4] w-18 shrink-0 border ${index === imageIndex ? "border-primary" : "border-surface-dim"}`}
              >
                <Image src={media.url} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
          <div className="relative order-1 aspect-[3/4] overflow-hidden bg-surface-container sm:order-2">
            {image ? (
              <Image
                src={image.url}
                alt={image.altText}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                Image coming soon
              </div>
            )}
          </div>
        </div>
        <div className="lg:pt-4">
          <p className="type-label text-on-tertiary-container">
            {item.brand?.name || item.artisan?.name || "Trendify collection"}
          </p>
          <h1 className="type-headline-lg mt-3 sm:text-4xl">{item.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-heading text-2xl">
              {formatPesewas(selected?.pricePesewas ?? item.basePricePesewas)}
            </span>
            {item.compareAtPricePesewas && (
              <span className="text-muted-foreground line-through">
                {formatPesewas(item.compareAtPricePesewas)}
              </span>
            )}
            {item.ratingCount > 0 && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="size-4 fill-kente-gold text-kente-gold" />
                {item.ratingAverage?.toFixed(1)} ({item.ratingCount})
              </span>
            )}
          </div>
          <p className="mt-6 leading-7 text-muted-foreground">
            {item.shortDescription}
          </p>
          <div className="mt-8">
            <div className="mb-3 flex justify-between text-sm font-semibold">
              <span>Choose an option</span>
              {item.sizeGuide && (
                <button
                  className="underline"
                  onClick={() => {
                    setTab("size")
                    document.getElementById("details")?.scrollIntoView()
                  }}
                >
                  Size guide
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {item.variants.map((variant) => (
                <button
                  key={variant.id}
                  disabled={!variant.availableQuantity}
                  onClick={() => setSelectedVariant(variant.id)}
                  className={`min-w-20 border px-3 py-3 text-sm ${selected?.id === variant.id ? "border-primary bg-primary text-white" : "border-outline-variant"} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <span className="block font-semibold">
                    {variant.sizeLabel || "One size"}
                  </span>
                  <span className="text-xs">
                    {variant.colorName || "Default"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <div className="flex h-12 items-center border border-outline-variant">
              <button
                className="grid size-11 place-items-center"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                className="grid size-11 place-items-center"
                onClick={() =>
                  setQuantity((value) =>
                    Math.min(selected?.availableQuantity ?? 1, value + 1)
                  )
                }
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              className="h-12 flex-1"
              disabled={!selected || add.isPending}
              onClick={() => addItem()}
            >
              <ShoppingBag /> {selected ? "Add to cart" : "Out of stock"}
            </Button>
            <Button
              className="h-12"
              size="icon"
              variant="outline"
              onClick={save}
            >
              <Heart />
              <span className="sr-only">Save to wishlist</span>
            </Button>
          </div>
          <Button
            className="mt-3 h-12 w-full"
            variant="accent"
            disabled={!selected || add.isPending}
            onClick={() => addItem(true)}
          >
            Buy now
          </Button>
          <div className="mt-8 grid gap-3 border-t border-surface-dim pt-6 text-sm">
            <p className="flex items-center gap-3">
              <Truck className="size-4" /> Delivery options calculated for your
              region at checkout.
            </p>
            {item.madeInGhana && (
              <p className="flex items-center gap-3">
                <Check className="size-4" /> Authentically made in Ghana.
              </p>
            )}
          </div>
        </div>
      </section>
      <section id="details" className="mx-auto mt-20 max-w-5xl scroll-mt-24">
        <div className="flex overflow-x-auto border-b border-outline-variant">
          {(["materials", "size", "reviews"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex-1 px-5 py-4 text-sm font-semibold whitespace-nowrap capitalize ${tab === value ? "border-b-2 border-primary" : "text-muted-foreground"}`}
            >
              {value === "size" ? "Size guide" : value}
            </button>
          ))}
        </div>
        {tab === "materials" && (
          <div className="grid gap-8 py-10 md:grid-cols-2">
            <div>
              <h2 className="type-headline-md">Materials and craft</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                {item.materialSummary ||
                  "Material details are being prepared by the brand."}
              </p>
            </div>
            <div>
              <h2 className="type-headline-md">Care guide</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                {item.careInstructions ||
                  "Follow the care label supplied with your piece."}
              </p>
            </div>
          </div>
        )}
        {tab === "size" && (
          <div className="py-10">
            <h2 className="type-headline-md">
              {item.sizeGuide?.name || "Size guide"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {item.sizeGuide?.description ||
                "Choose the variant that best matches your usual size."}
            </p>
            {item.sizeGuide && (
              <pre className="mt-6 overflow-auto border border-surface-dim bg-white p-5 text-xs">
                {JSON.stringify(item.sizeGuide.measurements, null, 2)}
              </pre>
            )}
          </div>
        )}
        {tab === "reviews" && (
          <div className="space-y-4 py-10">
            {item.reviews.length ? (
              item.reviews.map((review) => (
                <article
                  key={review.id}
                  className="border-b border-surface-dim pb-6"
                >
                  <div className="flex justify-between">
                    <h3 className="font-semibold">
                      {review.title || `${review.rating} star review`}
                    </h3>
                    <span className="text-sm text-kente-gold">
                      {"★".repeat(review.rating)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {review.customerName}
                  </p>
                  <p className="mt-4 leading-7">{review.body}</p>
                </article>
              ))
            ) : (
              <p className="text-muted-foreground">No approved reviews yet.</p>
            )}
          </div>
        )}
      </section>
      {item.recommendations.length > 0 && (
        <section className="section-space">
          <div className="mb-8">
            <p className="type-label text-on-tertiary-container">
              Complete the look
            </p>
            <h2 className="type-headline-lg mt-2">Recommended for you</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {item.recommendations.slice(0, 4).map((recommended) => (
              <ProductCard key={recommended.id} product={recommended} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
