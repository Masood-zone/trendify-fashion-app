import Image from "next/image"
import { Heart } from "lucide-react"

import { HeritageMark } from "@/components/brand/heritage-mark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type ProductCardProps = {
  name: string
  designer: string
  price: string
  image: string
  imageAlt: string
  badge?: string
  badgeTone?: "gold" | "burgundy" | "neutral"
}

function ProductCard({
  name,
  designer,
  price,
  image,
  imageAlt,
  badge,
  badgeTone = "gold",
}: ProductCardProps) {
  return (
    <article className="group min-w-0">
      <div className="relative mb-4 aspect-[3/4] overflow-hidden border border-surface-dim bg-surface-container-lowest">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
          {badge ? <Badge variant={badgeTone}>{badge}</Badge> : <span />}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Save ${name} to wishlist`}
            className="rounded-full border border-white/50 bg-white/85 text-primary backdrop-blur-sm hover:bg-white"
          >
            <Heart />
          </Button>
        </div>
        <HeritageMark className="absolute right-4 bottom-4 scale-[2.5] text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
        <Button className="absolute inset-x-4 bottom-4 hidden translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:inline-flex">
          Quick add to bag
        </Button>
      </div>
      <p className="type-label mb-1 text-muted-foreground">{designer}</p>
      <h3 className="font-heading text-lg leading-6 font-semibold text-foreground sm:text-xl">
        {name}
      </h3>
      <p className="mt-1 text-sm font-semibold text-foreground">{price}</p>
    </article>
  )
}

export { ProductCard, type ProductCardProps }
