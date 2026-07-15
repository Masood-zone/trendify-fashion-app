"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, RotateCcw, ShieldCheck, Truck, UsersRound } from "lucide-react"

import { HeritageMark, HeritageSeparator } from "@/components/brand/heritage-mark"
import { ProductCard } from "@/components/storefront/product-card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { NewsletterForm } from "@/components/storefront/newsletter-form"
import { cn } from "@/lib/utils"
import { useHome } from "@/services/storefront/storefront"
import type { HomepageSection } from "@/types/storefront"

const benefitIcons = [ShieldCheck, Truck, UsersRound, RotateCcw]

export function HomePage() {
  const home = useHome()
  if (home.isLoading) return <div className="page-shell grid min-h-[60vh] place-items-center text-sm text-muted-foreground">Curating the storefront…</div>
  if (home.isError) return <div className="page-shell grid min-h-[60vh] place-items-center"><button className="underline" onClick={() => home.refetch()}>The storefront could not be loaded. Try again.</button></div>
  if (!home.data?.sections.length) return <div className="page-shell grid min-h-[60vh] place-items-center text-center"><div><h1 className="type-headline-lg">Our next collection is being prepared.</h1><p className="mt-3 text-muted-foreground">Published homepage content will appear here as soon as the administrator releases it.</p><Link className={cn(buttonVariants(), "mt-6")} href="/shop">Browse the catalogue</Link></div></div>
  return <main>{home.data.sections.map((section) => <Section key={section.id} section={section} />)}</main>
}

function Section({ section }: { section: HomepageSection }) {
  if (section.type === "HERO") return <Hero section={section} />
  if (section.type === "BENEFITS") return <Benefits section={section} />
  if (section.type === "CATEGORY_GRID") return <CategoryGrid section={section} />
  if (section.type === "COLLECTION_SPOTLIGHT") return <Spotlight section={section} />
  if (section.type === "PRODUCT_CAROUSEL") return <Products section={section} />
  if (section.type === "HERITAGE_STORY") return <Story section={section} />
  if (section.type === "REGIONAL_TRENDS") return <Regional section={section} />
  if (section.type === "NEWSLETTER") return <Newsletter section={section} />
  return null
}

function Hero({ section }: { section: HomepageSection }) {
  return <section className="relative min-h-[43rem] overflow-hidden md:min-h-[50rem]">
    {section.image ? <Image src={section.image.url} alt={section.image.altText} fill priority sizes="100vw" className="object-cover object-center" /> : <div className="absolute inset-0 heritage-pattern" />}
    <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/20 to-transparent md:bg-linear-to-r md:from-surface/85 md:via-surface/20" />
    <div className="page-shell relative flex min-h-[43rem] items-end pb-14 md:min-h-[50rem] md:items-center md:pb-0">
      <div className="max-w-2xl">
        {section.eyebrow && <Badge variant="gold" className="mb-5">{section.eyebrow}</Badge>}
        <h1 className="type-display text-balance">{section.heading}</h1>
        {section.body && <p className="type-body-lg mt-5 max-w-xl text-on-surface-variant">{section.body}</p>}
        {section.ctaHref && section.ctaLabel && <Link href={section.ctaHref} className={cn(buttonVariants({ size: "lg" }), "mt-8")}>{section.ctaLabel}<ArrowRight /></Link>}
      </div>
    </div>
  </section>
}

function Benefits({ section }: { section: HomepageSection }) {
  return <section className="border-y border-surface-dim bg-surface-container-low py-9" aria-label={section.heading || "Shopping benefits"}><div className="page-shell grid grid-cols-2 gap-8 lg:grid-cols-4">{section.items.map((item, index) => { const Icon = benefitIcons[index % benefitIcons.length]; return <div key={item.id} className="text-center"><Icon className="mx-auto mb-3 size-6 text-on-tertiary-container" strokeWidth={1.5}/><h2 className="text-sm font-semibold">{item.title}</h2>{item.body && <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>}</div> })}</div></section>
}

function CategoryGrid({ section }: { section: HomepageSection }) {
  return <section className="page-shell section-space"><Heading section={section}/><div className="grid auto-rows-[21rem] gap-4 md:grid-cols-12">{section.categories.map((category, index) => <Link key={category.id} href={`/shop?category=${category.slug}`} className={cn("group relative overflow-hidden border border-surface-dim bg-surface-container", index === 0 ? "md:col-span-7 md:row-span-2" : "md:col-span-5")}>
    {category.imageUrl && <Image src={category.imageUrl} alt={`${category.name} collection`} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}
    <div className="absolute inset-0 bg-black/15"/><div className="ambient-shadow absolute right-4 bottom-4 left-4 bg-white/90 p-5 backdrop-blur sm:right-auto sm:min-w-64"><h3 className="type-headline-md">{category.name}</h3><p className="mt-1 text-sm text-muted-foreground">{category.description}</p><span className="mt-3 flex items-center gap-2 text-xs font-bold uppercase">Discover <ArrowRight className="size-4"/></span></div>
  </Link>)}</div></section>
}

function Spotlight({ section }: { section: HomepageSection }) {
  const collection = section.collections[0]
  return <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground lg:py-28"><HeritageMark className="absolute -top-6 right-8 scale-[18] text-white opacity-[0.04]"/><div className="page-shell grid items-center gap-12 lg:grid-cols-2"><div className="relative z-10">{section.eyebrow && <Badge variant="gold" className="mb-6">{section.eyebrow}</Badge>}<h2 className="type-display">{section.heading || collection?.name}</h2><p className="type-body-lg mt-6 max-w-xl text-primary-fixed-dim">{section.body || collection?.description}</p><Link href={section.ctaHref || (collection ? `/collections/${collection.slug}` : "/collections")} className={cn(buttonVariants({ variant: "accent", size: "lg" }), "mt-8")}>{section.ctaLabel || "Shop the collection"}<ArrowRight/></Link></div><div className="relative aspect-[4/3] overflow-hidden bg-primary-container">{(section.image?.url || collection?.imageUrl) && <Image src={section.image?.url || collection!.imageUrl!} alt={section.image?.altText || collection!.name} fill sizes="50vw" className="object-cover"/>}</div></div></section>
}

function Products({ section }: { section: HomepageSection }) {
  return <section className="page-shell section-space"><Heading section={section}/>{section.products.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-6">{section.products.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <p className="border border-dashed border-surface-dim p-8 text-center text-muted-foreground">No published products are linked to this section.</p>}</section>
}

function Story({ section }: { section: HomepageSection }) {
  return <section className="heritage-pattern section-space border-y border-surface-dim"><div className="page-shell max-w-4xl text-center"><HeritageSeparator className="mb-8"/><p className="type-label mb-4 text-on-tertiary-container">{section.eyebrow}</p><h2 className="type-display">{section.heading}</h2><p className="type-body-lg mx-auto mt-5 max-w-3xl text-on-surface-variant">{section.body}</p><div className="mt-12 grid gap-5 text-left md:grid-cols-2">{section.items.map((item) => <article key={item.id} className="ambient-shadow border border-surface-dim bg-white/88 p-8"><h3 className="type-headline-md">{item.title}</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">{item.body}</p>{item.href && <Link href={item.href} className="mt-6 inline-flex items-center gap-2 text-sm font-bold">Explore <ArrowRight className="size-4"/></Link>}</article>)}</div></div></section>
}

function Regional({ section }: { section: HomepageSection }) {
  return <section className="page-shell py-16"><Heading section={section}/><div className="grid gap-6 md:grid-cols-2">{section.items.map((item) => <Link key={item.id} href={item.href || "/shop"} className="flex gap-5 border-t border-surface-dim py-5">{item.imageUrl && <div className="relative size-24 shrink-0"><Image src={item.imageUrl} alt={item.title} fill className="object-cover"/></div>}<div><h3 className="font-heading text-xl font-semibold">{item.title}</h3><p className="mt-2 text-sm text-muted-foreground">{item.body}</p></div></Link>)}</div></section>
}

function Newsletter({ section }: { section: HomepageSection }) {
  return <section className="bg-surface-container py-20"><div className="page-shell text-center"><p className="type-label mb-3 text-on-tertiary-container">{section.eyebrow}</p><h2 className="type-headline-lg">{section.heading}</h2><p className="mx-auto mt-4 max-w-xl text-muted-foreground">{section.body}</p><NewsletterForm/></div></section>
}

function Heading({ section }: { section: HomepageSection }) {
  return <div className="mb-10 flex items-end justify-between gap-6"><div><p className="type-label mb-3 text-on-tertiary-container">{section.eyebrow}</p><h2 className="type-headline-lg">{section.heading}</h2>{section.body && <p className="mt-2 text-muted-foreground">{section.body}</p>}</div>{section.ctaHref && <Link href={section.ctaHref} className="hidden items-center gap-2 text-sm font-semibold sm:flex">{section.ctaLabel || "View all"}<ArrowRight className="size-4"/></Link>}</div>
}
