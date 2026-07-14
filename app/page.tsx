import Image from "next/image"
import {
  ArrowRight,
  CircleUserRound,
  Globe2,
  Heart,
  House,
  Mail,
  Menu,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UsersRound,
} from "lucide-react"

import {
  HeritageMark,
  HeritageSeparator,
} from "@/components/brand/heritage-mark"
import {
  ProductCard,
  type ProductCardProps,
} from "@/components/storefront/product-card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBZsNCbJVA7MwV-Zzwhvoa_hqvkYAKOjm1kE04fy8o3dZUUonDeIf7rR9L8m9O-U8V2l0RKH9jm19umTsZJxqIL8WEIqtCWLWTOFG2qktX0wEh4a65JKFRsJOLBy3RTod4qqY3aiAcLzSpMcWAkHoLC1lN2eNoVKcLqmKjhb-Q4VMAXG0LoL35M9WFMIlBcubIA9bQ8eRIkAATyExmGhNAI1ttTA6CvYUqoKBr4SF0hE7lxLuj1Ihd6Fg"

const categories = [
  {
    name: "Women",
    description: "Timeless silhouettes, local spirit.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD_be1ntxD7PwqhYHkOq7g27Wn0xF9Zv5lnKgXtumg9-JHpWv1Aq44NIfCei2Lv9G6wd20fWXqPwisgXDIdWJX0AJVOamvAa2cdTQycWEQW3eV8w9oYhWhycK4B68VmrD2C5S1jrKc434sFHuMSH1Ehs01tXCzrORzH3PHJ0EXYyjb2yV5bnYQdxjucDksJT3qMxF70k40J1xbI3gdxu1mGCqQniecw1AQPJEdOojcBi4mpGRTdb-2s8A",
    className: "md:col-span-7 md:row-span-2",
  },
  {
    name: "Bags & Shoes",
    description: "Made to travel beautifully.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBXjPaKQyGzaAsSg4bcse4CFqBYv4Fqi8KTnxdRIB-asRjakvafR5xkbuwV2zUDl3pxQXVt-b4ryneuDgPhsjyZ58g1Zo7dKdi9Z3AKEIcio-xWOrgxzRhywbjHg933OtgEGa_A5kZThdcZA0eYf9bXn0xqlXyM9fzQzdgqoM0p_lxJ17P8_oN6-KrgFoeHKqnuhCuUt6wEwlVr_KJZvrb36HAkhfKSg1F7DiGXRY2qJnYU1gZkM1cFUQ",
    className: "md:col-span-5",
  },
  {
    name: "Men",
    description: "Heritage in a modern cut.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD6XGq-glHUPHAeWEUJaiBgudSZ6kxTFjH04cGC92L-oNBCiPytgSJMTGQ-TnSP2FhNXA9ROJHEfAguDTX0vVwW1AcYSGfcjX-SZJqFVMeDZ7buYJbnPhuag4rv5VwMpH64_VO1YING79EuIV2NQF1cNgHdc4vq6eiDVR1FjaimYZeEOyhWHlOw6WJlh8JIjbzEYF6manC1Zc2J2-eQMdbhnHsdjYpP3yi52Fz5HrsDHzjQlZKqicyNfA",
    className: "md:col-span-5",
  },
] as const

const products: ProductCardProps[] = [
  {
    name: "Modern Adinkra Shirt",
    designer: "Studio Collection",
    price: "GH₵ 450",
    badge: "Made in Ghana",
    badgeTone: "gold",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCR3dbOMZxnhu9E0bw1NbR_4IJjKI1FRLuxgwj3xcPnFBTXdhbHAIoOtdBe_5F1KBM30YKG2ORJSUfA_vUPPTtd2yjKXgk0Fdidub8fqYvQypftOwWXR39MDPpzCbF6yH1xEPeAKVwd3aXDnOrneWDSXnJQW-6YuTGeClKiM2WkAubkVDXmoqLaBLsmpL2jsjINoRZFPhCtvPjrUWFlIL2DKuuVcjTV8ykkABMubn_TlnLqsYmxJ4xYKQ",
    imageAlt:
      "Modern Ghanaian shirt with a minimal geometric print on a wooden hanger",
  },
  {
    name: "Indigo Wrap Dress",
    designer: "Artisan Series",
    price: "GH₵ 720",
    badge: "Limited edition",
    badgeTone: "neutral",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNgAEpbnwNZzaVwYOnWn-VgHJoHoHSPdUx-PE8GVkNsSaEXRHHHdSoGmy4gWAnt2zNvMAle6TVch24nJ7KcrnpkZWegHTNDepX5pdyPajGzxByXVM-QmoamJ7LmWZGwC5GQtdiCDZGhkyRP3kaHi3YI-1YicT3JawBDArF47Dlil51aL4u7yqnH5qVBSibnOZF4-v4gm4X4Q7Ubz6ioupl2s2nwi4TDdlNtQnBqygR_PVs4zfNC3EtSw",
    imageAlt: "Indigo-dyed contemporary wrap dress in a minimalist studio",
  },
  {
    name: "Heritage Kente Slides",
    designer: "Stepwise GH",
    price: "GH₵ 350",
    badge: "Trending",
    badgeTone: "burgundy",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBXtM_vPKcMcU4ICHBg7KLrrOqPqi0uClB1wbzZrGZkRtBsnRc8ceZJ2gj0kIWAvEky9Jq3LJA7Ed3XhmUMewIp-c7Zxi9KfIK0qzoUWIZ8IMcx1_oODsBX1qtD7HLKiskEz4yozdUwDHSexM-0feIPTiJgx6DzxZC4cobmu5kbFaktdlLmcIKtREqJxFaI8NPf45_j_egCxg2gAgnwLP5X_3WIfUCd5Eu2WbqWQ8qFyyCcyyjQ361Piw",
    imageAlt: "Premium leather slides with hand-woven kente straps",
  },
  {
    name: "Brass Soul Pendant",
    designer: "Golden Coast Gems",
    price: "GH₵ 280",
    badge: "Made in Ghana",
    badgeTone: "gold",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBXsakCsVPj9xjFMyGk34QYgqZKOK44c9H9mAG7NAwv7PrApl825kwG4mO6PC05xsPwClG__ufwTs30Snben6sg2RvK0IZA8SjEWc-Qj91lAqYL-12Y2oLotvPy2YSU86LB2EXbyosJqqVminGJVuHP3fXQZ3VO9qU9J0S_eo-mOwQThov9i5jEAeSv-V9jihGq8sIe6EIx7qjS_-2cnSX0ZuhzaxJW67bBdx1gLlyPpID5lpO7FyR3xA",
    imageAlt: "Minimal brass pendant modeled against a crisp white shirt",
  },
]

const brandValues = [
  {
    icon: ShieldCheck,
    title: "Secure Mobile Money",
    detail: "MTN & Telecel Cash",
  },
  {
    icon: Truck,
    title: "Nationwide Delivery",
    detail: "Safe shipping across Ghana",
  },
  {
    icon: UsersRound,
    title: "Support Designers",
    detail: "Directly empowering artisans",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    detail: "30-day hassle-free policy",
  },
]

const spotlightImages = [
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjJgt2_fL4e1uLQa4hk6t5PGxXrkVv9u3CzcQUEDQNjyzEhOffvjE-fjx00omc0SOH0F3MJJF6e2MLCPNTH5_J-cLjFrQjh1uQkkXeqkuiOhCKR78UR4TOb637D8e8CEU4jXMMbdljwwb0wtPtpJJNef9dVjzsv9MiXABPc4P0bM2sgyJqBJG3bhFo8WZQMMSlC0R00xFW_qc6f9FgsIVMC7Vb-9qD_F6tJFaHhg2eDZT-S9f4dUvEFw",
    alt: "Artisan carefully stitching forest-green fabric in an Accra atelier",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzJKJ4MK-Xda-olV3rmnIwCikOhe_r-TdSI2flZWDl6jR9dvvKRaztaNfH_2sQ-b-l1nBUbtA0SbVrs0-zJP0J_09zKLVPa5axpY7v5HBCnPnXZIk8NSfznWtLwkMZbxXp6-SFCWPlwqwsV2bsNlKYHR55x8KF936wSLGYo9OaOW0sJOD6gMaN5VkVXJF8ZLU2S2ZjLAKd07qXH2WvE99KRrT_ylMIQuvd3fLgzcivsLwdGj0NtWnerA",
    alt: "Woman wearing a flowing forest-green wrap dress in warm natural light",
  },
]

function StoreHeader() {
  return (
    <>
      <div className="bg-primary px-4 py-2 text-center text-[0.6875rem] font-semibold tracking-wide text-primary-foreground">
        Proudly celebrating Ghanaian fashion & craftsmanship · Secure Mobile
        Money available
      </div>
      <header className="sticky top-0 z-50 border-b border-surface-dim bg-surface/95 backdrop-blur-xl">
        <div className="page-shell flex h-18 items-center justify-between gap-6">
          <details className="group relative md:hidden">
            <summary className="flex size-10 list-none items-center justify-center rounded-full hover:bg-surface-container-low [&::-webkit-details-marker]:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Open navigation</span>
            </summary>
            <nav className="ambient-shadow absolute top-13 -left-1 w-64 border border-surface-dim bg-white p-5">
              <p className="type-label mb-4 text-muted-foreground">Browse</p>
              <div className="flex flex-col">
                {[
                  ["Home", "#top"],
                  ["Shop", "#new-arrivals"],
                  ["Made in Ghana", "#made-in-ghana"],
                  ["Collections", "#collections"],
                ].map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    className="border-b border-surface-dim py-3 text-sm font-semibold last:border-0"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </nav>
          </details>

          <a
            href="#top"
            className="font-heading text-xl leading-5 font-bold tracking-tight sm:text-2xl"
          >
            Fashion Trendify <span className="whitespace-nowrap">GH</span>
          </a>

          <nav
            className="hidden items-center gap-7 md:flex"
            aria-label="Primary"
          >
            <a
              className="border-b-2 border-primary pb-1 text-sm font-semibold"
              href="#top"
            >
              Home
            </a>
            <a
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              href="#new-arrivals"
            >
              Shop
            </a>
            <a
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              href="#made-in-ghana"
            >
              Made in Ghana
            </a>
            <a
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              href="#collections"
            >
              Collections
            </a>
          </nav>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Search">
              <Search />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Wishlist"
              className="hidden sm:inline-flex"
            >
              <Heart />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Account"
              className="hidden sm:inline-flex"
            >
              <CircleUserRound />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Shopping bag"
              className="relative"
            >
              <ShoppingBag />
              <span className="absolute top-1 right-1 size-2 rounded-full bg-error" />
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}

function Page() {
  return (
    <div id="top" className="overflow-x-clip pb-16 md:pb-0">
      <StoreHeader />

      <main>
        <section className="relative min-h-[43rem] overflow-hidden md:min-h-[48rem] lg:min-h-[52rem]">
          <Image
            src={heroImage}
            alt="Ghanaian model in a contemporary structural kente-inspired gown"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[62%_center] md:object-center"
          />
          <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/10 to-transparent md:bg-linear-to-r md:from-surface/80 md:via-surface/20 md:to-transparent" />
          <div className="page-shell relative flex min-h-[43rem] items-end pb-12 md:min-h-[48rem] md:items-center md:pb-0 lg:min-h-[52rem]">
            <div className="max-w-2xl">
              <Badge variant="gold" className="mb-5">
                Premium heritage
              </Badge>
              <h1 className="type-display text-balance">
                Modern Ghanaian Style, Made for You
              </h1>
              <p className="type-body-lg mt-5 max-w-xl text-on-surface-variant">
                Celebrating contemporary fashion, local creativity, and global
                style with a heart rooted in Ghanaian heritage.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#new-arrivals"
                  className={buttonVariants({ size: "lg" })}
                >
                  Shop new arrivals <ArrowRight />
                </a>
                <a
                  href="#made-in-ghana"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Explore made in Ghana
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-y border-surface-dim bg-surface-container-low py-9"
          aria-label="Shopping benefits"
        >
          <div className="page-shell grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {brandValues.map(({ icon: Icon, title, detail }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center"
              >
                <Icon
                  className="mb-3 size-6 text-on-tertiary-container"
                  strokeWidth={1.5}
                />
                <h2 className="text-sm font-semibold">{title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="collections"
          className="page-shell section-space scroll-mt-24"
        >
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="type-label mb-3 text-on-tertiary-container">
                Shop by story
              </p>
              <h2 className="type-headline-lg">Curated Collections</h2>
            </div>
            <a
              href="#new-arrivals"
              className="hidden items-center gap-2 border-b border-outline-variant pb-1 text-sm font-semibold sm:flex"
            >
              View all categories <ArrowRight className="size-4" />
            </a>
          </div>
          <div className="grid auto-rows-[22rem] grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-12 lg:auto-rows-[20rem]">
            {categories.map((category) => (
              <article
                key={category.name}
                className={cn(
                  "group relative overflow-hidden bg-surface-container",
                  category.className
                )}
              >
                <Image
                  src={category.image}
                  alt={`${category.name} fashion collection`}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
                <div className="ambient-shadow absolute right-4 bottom-4 left-4 border border-white/60 bg-white/88 p-5 backdrop-blur-md sm:right-auto sm:left-6 sm:min-w-64">
                  <div className="kente-rule absolute inset-x-0 bottom-0 h-1" />
                  <h3 className="type-headline-md">{category.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                  <span className="mt-3 flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                    Discover <ArrowRight className="size-4" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="made-in-ghana"
          className="relative scroll-mt-18 overflow-hidden bg-primary py-20 text-primary-foreground lg:py-28"
        >
          <HeritageMark className="absolute -top-6 right-8 scale-[18] text-white opacity-[0.04]" />
          <div className="page-shell grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="relative z-10">
              <Badge variant="gold" className="mb-6">
                Spotlight on artisans
              </Badge>
              <h2 className="type-display">The Forest Green Collection</h2>
              <p className="type-body-lg mt-6 max-w-xl text-primary-fixed-dim">
                Inspired by Ghana&apos;s tropical canopy, this limited
                collection pairs hand-dyed organic cotton with ethically sourced
                leather, produced entirely in our Accra atelier.
              </p>
              <div className="my-8 flex gap-10 border-l-2 border-kente-gold pl-6">
                <div>
                  <p className="font-heading text-2xl font-semibold">100%</p>
                  <p className="type-label mt-1 text-primary-fixed-dim">
                    Locally sourced
                  </p>
                </div>
                <div>
                  <p className="font-heading text-2xl font-semibold">24</p>
                  <p className="type-label mt-1 text-primary-fixed-dim">
                    Master artisans
                  </p>
                </div>
              </div>
              <Button variant="accent" size="lg">
                Shop the collection <ArrowRight />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {spotlightImages.map((image, index) => (
                <div
                  key={image.src}
                  className={cn(
                    "relative overflow-hidden",
                    index === 0 ? "mt-10 aspect-[4/5]" : "aspect-[3/5]"
                  )}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 28vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="new-arrivals"
          className="page-shell section-space scroll-mt-24"
        >
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="type-label mb-3 text-on-tertiary-container">
                Fresh from the atelier
              </p>
              <h2 className="type-headline-lg">New Arrivals</h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                The latest drops from Ghana&apos;s contemporary labels.
              </p>
            </div>
            <a
              href="#newsletter"
              className="hidden items-center gap-2 text-sm font-semibold sm:flex"
            >
              See the edit <ArrowRight className="size-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product.name} {...product} />
            ))}
          </div>
        </section>

        <section className="heritage-pattern section-space border-y border-surface-dim">
          <div className="page-shell max-w-4xl text-center">
            <HeritageSeparator className="mb-8" />
            <p className="type-label mb-4 text-on-tertiary-container">
              Rooted forward
            </p>
            <h2 className="type-display">The Heritage Series</h2>
            <p className="type-body-lg mx-auto mt-5 max-w-3xl text-on-surface-variant">
              Every thread tells a story. Discover collections inspired by
              ancient Adinkra wisdom and the royal weaving traditions of
              Bonwire—fashion that honours where we come from while looking
              ahead.
            </p>
            <div className="mt-12 grid gap-5 text-left md:grid-cols-2">
              {[
                [
                  "Sankofa Spirit",
                  "Revisit the past to build a better future through traditional motifs used in unexpected, modern ways.",
                ],
                [
                  "The Kente Edit",
                  "Handwoven by master weavers in the Ashanti Region, these pieces represent the pinnacle of Ghanaian luxury.",
                ],
              ].map(([title, description]) => (
                <article
                  key={title}
                  className="ambient-shadow border border-surface-dim bg-white/88 p-7 backdrop-blur-sm sm:p-9"
                >
                  <h3 className="type-headline-md">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                  <a
                    href="#new-arrivals"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold"
                  >
                    Explore collection <ArrowRight className="size-4" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="newsletter"
          className="scroll-mt-24 bg-surface-container py-18 sm:py-22"
        >
          <div className="page-shell text-center">
            <p className="type-label mb-3 text-on-tertiary-container">
              The Trendify letter
            </p>
            <h2 className="type-headline-lg">
              Stay Connected to Ghanaian Style
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Get early access to Heritage drops, artisan stories, and
              considered style inspiration delivered to your inbox.
            </p>
            <form className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <Input
                id="newsletter-email"
                type="email"
                placeholder="Your email address"
                className="sm:h-13"
              />
              <Button type="submit" size="lg">
                Subscribe
              </Button>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-primary-foreground">
        <div className="page-shell grid gap-12 py-18 sm:grid-cols-2 lg:grid-cols-4 lg:py-24">
          <div>
            <h2 className="font-heading text-2xl font-bold">
              Fashion Trendify GH
            </h2>
            <p className="mt-5 max-w-xs text-sm leading-6 text-primary-fixed-dim">
              Elevating Ghanaian fashion through heritage and contemporary
              design. Shipped with pride from Accra to the world.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                [Share2, "Share"],
                [Globe2, "Website"],
                [Mail, "Email"],
              ].map(([Icon, label]) => {
                const SocialIcon = Icon as typeof Share2
                return (
                  <a
                    key={label as string}
                    href="#newsletter"
                    aria-label={label as string}
                    className="flex size-10 items-center justify-center rounded-full border border-white/25 hover:bg-white hover:text-primary"
                  >
                    <SocialIcon className="size-4" />
                  </a>
                )
              })}
            </div>
          </div>
          <div>
            <h3 className="type-label mb-5">Shop</h3>
            <ul className="space-y-3 text-sm text-primary-fixed-dim">
              <li>
                <a href="#new-arrivals" className="hover:text-white">
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#made-in-ghana" className="hover:text-white">
                  Made in Ghana
                </a>
              </li>
              <li>
                <a href="#collections" className="hover:text-white">
                  Women&apos;s Collection
                </a>
              </li>
              <li>
                <a href="#collections" className="hover:text-white">
                  Men&apos;s Collection
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="type-label mb-5">Information</h3>
            <ul className="space-y-3 text-sm text-primary-fixed-dim">
              <li>
                <a href="#top" className="hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#top" className="hover:text-white">
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="#top" className="hover:text-white">
                  Sustainability
                </a>
              </li>
              <li>
                <a href="#top" className="hover:text-white">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="type-label mb-5">Accepted payments</h3>
            <div className="flex flex-wrap gap-2">
              {["MTN MoMo", "Telecel Cash", "Visa"].map((payment) => (
                <span
                  key={payment}
                  className="bg-white px-3 py-2 text-[0.6875rem] font-bold text-primary"
                >
                  {payment}
                </span>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-primary-fixed-dim">
              Secure local payments via Mobile Money and major cards.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="page-shell flex flex-col gap-3 py-6 text-xs text-primary-fixed-dim sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Fashion Trendify GH. Made in Ghana with pride.</p>
            <div className="flex gap-6">
              <a href="#top">Terms</a>
              <a href="#top">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-surface-dim bg-surface/95 px-2 py-2 backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        {[
          [House, "Home", "#top"],
          [Search, "Shop", "#new-arrivals"],
          [Heart, "Wishlist", "#new-arrivals"],
          [CircleUserRound, "Account", "#top"],
        ].map(([Icon, label, href], index) => {
          const NavIcon = Icon as typeof House
          return (
            <a
              key={label as string}
              href={href as string}
              className={cn(
                "flex flex-col items-center gap-1 py-1 text-[0.625rem] font-semibold",
                index === 0 ? "text-primary" : "text-muted-foreground"
              )}
            >
              <NavIcon className="size-4" />
              {label as string}
            </a>
          )
        })}
      </nav>
    </div>
  )
}

export default Page
