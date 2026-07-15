import type { MoneyPesewas, Paginated } from "@/types"

export type StorefrontMedia = {
  id: string
  url: string
  altText: string
  primary: boolean
}

export type StorefrontVariant = {
  id: string
  sku: string
  sizeLabel: string | null
  colorName: string | null
  colorHex: string | null
  pricePesewas: MoneyPesewas
  compareAtPricePesewas: MoneyPesewas | null
  availableQuantity: number
  active: boolean
}

export type ProductListItem = {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  basePricePesewas: MoneyPesewas
  compareAtPricePesewas: MoneyPesewas | null
  audience: "MEN" | "WOMEN" | "UNISEX" | null
  featured: boolean
  newArrival: boolean
  madeInGhana: boolean
  brand: { id: string; name: string; slug: string } | null
  artisan: { id: string; name: string; slug: string } | null
  media: StorefrontMedia[]
  variants: StorefrontVariant[]
  categories: Array<{ id: string; name: string; slug: string }>
  collections: Array<{ id: string; name: string; slug: string }>
  available: boolean
}

export type ProductDetail = ProductListItem & {
  description: string
  materialSummary: string | null
  careInstructions: string | null
  seoTitle: string | null
  seoDescription: string | null
  tags: Array<{ id: string; name: string; slug: string }>
  sizeGuide: {
    id: string
    name: string
    description: string | null
    measurementUnit: string
    measurements: unknown
  } | null
  reviews: Array<{
    id: string
    rating: number
    title: string | null
    body: string
    createdAt: string
    customerName: string
  }>
  ratingAverage: number | null
  ratingCount: number
  recommendations: ProductListItem[]
}

export type ProductPage = Paginated<ProductListItem> & {
  facets: {
    brands: Array<{ id: string; name: string; slug: string }>
    sizes: string[]
    colors: Array<{ name: string; hex: string | null }>
  }
}

export type CategorySummary = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  featured: boolean
}

export type CollectionSummary = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  featured: boolean
}

export type HomepageSection = {
  id: string
  key: string
  type:
    | "HERO"
    | "BENEFITS"
    | "CATEGORY_GRID"
    | "COLLECTION_SPOTLIGHT"
    | "PRODUCT_CAROUSEL"
    | "HERITAGE_STORY"
    | "REGIONAL_TRENDS"
    | "NEWSLETTER"
  eyebrow: string | null
  heading: string | null
  body: string | null
  ctaLabel: string | null
  ctaHref: string | null
  image: StorefrontMedia | null
  config: Record<string, unknown>
  items: Array<{
    id: string
    title: string
    body: string | null
    icon: string | null
    imageUrl: string | null
    href: string | null
  }>
  products: ProductListItem[]
  categories: CategorySummary[]
  collections: CollectionSummary[]
}

export type StoreSettingsData = {
  brandName: string
  supportEmail: string | null
  supportPhone: string | null
  whatsappNumber: string | null
  address: string | null
  socialLinks: Record<string, string>
  checkoutConfig: CheckoutConfig
}

export type HomepageData = {
  sections: HomepageSection[]
  settings: StoreSettingsData
}

export type CartLine = {
  id: string
  quantity: number
  lineTotalPesewas: MoneyPesewas
  variant: StorefrontVariant & {
    product: Pick<
      ProductListItem,
      "id" | "name" | "slug" | "brand" | "media"
    >
  }
}

export type CartData = {
  id: string
  itemCount: number
  subtotalPesewas: MoneyPesewas
  items: CartLine[]
}

export type CheckoutConfig = {
  guestCheckout: boolean
  reservationMinutes: number
  taxRateBasisPoints: number
  freeDeliveryThresholdPesewas: number | null
  country: "GH"
  currency: "GHS"
}

export type CheckoutInput = {
  customerName: string
  email: string
  phone: string
  alternatePhone?: string
  deliveryRegion: string
  deliveryCityTown: string
  deliveryAreaSuburb?: string
  deliveryGhanaPostGps?: string
  deliveryStreetAddress: string
  deliveryNearbyLandmark?: string
  deliveryInstructions?: string
  deliveryMethodCode: string
  promotionCode?: string
}

export type CheckoutQuote = {
  subtotalPesewas: MoneyPesewas
  discountPesewas: MoneyPesewas
  taxPesewas: MoneyPesewas
  deliveryFeePesewas: MoneyPesewas
  totalPesewas: MoneyPesewas
  currency: "GHS"
}

export type OrderCreated = CheckoutQuote & {
  orderId: string
  orderNumber: string
  reservationExpiresAt: string
  guestAccessToken?: string
}

export type DeliveryMethodData = {
  id: string
  code: string
  name: string
  description: string | null
  feePesewas: number
  estimatedMinDays: number
  estimatedMaxDays: number
  regions: string[]
}
