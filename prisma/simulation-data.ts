export const SIMULATION_PREFIX = "simulation/trendify-gh-v1"
export const SIMULATION_PUBLISHED_AT = new Date("2026-01-15T09:00:00.000Z")

export const brands = [
  {
    name: "Nkyinkyim House",
    slug: "nkyinkyim-house",
    logoUrl: "/simulation/brands/nkyinkyim-house.svg",
    description: "Refined contemporary clothing shaped in Accra with subtle Adinkra geometry, structured silhouettes, and warm earth tones.",
  },
  {
    name: "Sankofa Steps",
    slug: "sankofa-steps",
    logoUrl: "/simulation/brands/sankofa-steps.svg",
    description: "Modern footwear and leather goods finished for daily Ghanaian city life in indigo, brass, and forest tones.",
  },
  {
    name: "Ahenema & Loom",
    slug: "ahenema-and-loom",
    logoUrl: "/simulation/brands/ahenema-and-loom.svg",
    description: "Premium accessories combining ceremonial forms, beadwork, brass craft, and vibrant woven textiles.",
  },
] as const

export const artisans = [
  { name: "Ama Serwaa Mensah", slug: "ama-serwaa-mensah", region: "Greater Accra", craft: "precision tailoring and garment construction" },
  { name: "Kwabena Ofori", slug: "kwabena-ofori", region: "Ashanti", craft: "leather finishing and hand-built accessories" },
  { name: "Safia Abdul-Rahman", slug: "safia-abdul-rahman", region: "Northern", craft: "woven cloth detailing and textile finishing" },
  { name: "Esi Nyarko", slug: "esi-nyarko", region: "Central", craft: "brass, bead, and ceremonial accessory work" },
] as const

export const categories = [
  { name: "Clothing", slug: "clothing", parentSlug: null },
  { name: "Dresses", slug: "dresses", parentSlug: "clothing" },
  { name: "Shirts & Tops", slug: "shirts-and-tops", parentSlug: "clothing" },
  { name: "Bottoms", slug: "bottoms", parentSlug: "clothing" },
  { name: "Outerwear", slug: "outerwear", parentSlug: "clothing" },
  { name: "One Pieces", slug: "one-pieces", parentSlug: "clothing" },
  { name: "Bags", slug: "bags", parentSlug: null },
  { name: "Jewellery", slug: "jewellery", parentSlug: null },
  { name: "Accessories", slug: "accessories", parentSlug: null },
] as const

export const collections = [
  { name: "Trendify New Arrivals", slug: "trendify-new-arrivals" },
  { name: "Contemporary Ghana", slug: "contemporary-ghana" },
  { name: "City Craft Essentials", slug: "city-craft-essentials" },
  { name: "Ceremony Reimagined", slug: "ceremony-reimagined" },
  { name: "Across Ghana Edit", slug: "across-ghana-edit" },
] as const

export const tags = [
  ["Made in Ghana", "made-in-ghana"],
  ["Handcrafted", "handcrafted"],
  ["Contemporary African", "contemporary-african"],
  ["Adinkra Inspired", "adinkra-inspired"],
  ["Woven Detail", "woven-detail"],
  ["Leather", "leather"],
  ["Brass", "brass"],
  ["Beadwork", "beadwork"],
  ["Occasionwear", "occasionwear"],
  ["Everyday", "everyday"],
] as const

export const sizeGuides = [
  { key: "clothing", name: "Simulation Clothing Regular", description: "Body measurements for the Trendify simulation clothing range.", measurements: { S: { bust: 86, waist: 70, hip: 94 }, M: { bust: 92, waist: 76, hip: 100 }, L: { bust: 100, waist: 84, hip: 108 }, XL: { bust: 108, waist: 92, hip: 116 } } },
  { key: "footwear", name: "Simulation Footwear", description: "EU sizing and approximate foot length.", measurements: { "40": { footLength: 25.3 }, "41": { footLength: 26 }, "42": { footLength: 26.7 }, "43": { footLength: 27.3 } } },
  { key: "bags", name: "Simulation Bags", description: "Finished bag dimensions by option.", measurements: { Compact: { width: 24, height: 17 }, Standard: { width: 38, height: 30 } } },
  { key: "accessories", name: "Simulation Jewellery & Accessories", description: "Adjustable and finished accessory measurements.", measurements: { Compact: { length: 18 }, Standard: { length: 45 }, Extended: { length: 70 } } },
] as const

export type VariantMode = "clothing4" | "footwear4" | "colour2" | "accessory2" | "accessory3"
export type SimulationProduct = {
  name: string
  brandSlug: (typeof brands)[number]["slug"]
  artisanSlug: (typeof artisans)[number]["slug"]
  categorySlug: string
  collectionSlug: (typeof collections)[number]["slug"]
  price: number
  mode: VariantMode
  audience: "MEN" | "WOMEN" | "UNISEX"
  material: string
  design: string
  tagSlugs: string[]
}

export const products: SimulationProduct[] = [
  { name: "Adinkra Line Wrap Dress", brandSlug: "nkyinkyim-house", artisanSlug: "ama-serwaa-mensah", categorySlug: "dresses", collectionSlug: "ceremony-reimagined", price: 52000, mode: "clothing4", audience: "WOMEN", material: "breathable cotton-linen with woven cotton trim", design: "A softly structured wrap silhouette traced with restrained geometric linework.", tagSlugs: ["adinkra-inspired", "occasionwear"] },
  { name: "Cocoa Loom Structured Shirt", brandSlug: "nkyinkyim-house", artisanSlug: "safia-abdul-rahman", categorySlug: "shirts-and-tops", collectionSlug: "contemporary-ghana", price: 34000, mode: "clothing4", audience: "UNISEX", material: "midweight cotton with hand-finished woven panels", design: "A clean city shirt with a cocoa-toned loom detail across the placket.", tagSlugs: ["woven-detail", "everyday"] },
  { name: "Nkyinkyim Panel Trousers", brandSlug: "nkyinkyim-house", artisanSlug: "ama-serwaa-mensah", categorySlug: "bottoms", collectionSlug: "city-craft-essentials", price: 41000, mode: "clothing4", audience: "UNISEX", material: "cotton twill with tonal woven inserts", design: "Tapered trousers using curved panels to suggest movement and resilience.", tagSlugs: ["adinkra-inspired", "everyday"] },
  { name: "Clay Horizon Midi Skirt", brandSlug: "nkyinkyim-house", artisanSlug: "ama-serwaa-mensah", categorySlug: "bottoms", collectionSlug: "trendify-new-arrivals", price: 36000, mode: "clothing4", audience: "WOMEN", material: "washed cotton poplin with a soft viscose lining", design: "A clay-toned midi skirt cut with a crisp horizon seam and generous movement.", tagSlugs: ["contemporary-african", "everyday"] },
  { name: "Accra Arc Bomber Jacket", brandSlug: "nkyinkyim-house", artisanSlug: "safia-abdul-rahman", categorySlug: "outerwear", collectionSlug: "across-ghana-edit", price: 72000, mode: "clothing4", audience: "UNISEX", material: "cotton canvas, woven accents, and recycled lining", design: "A lightweight statement bomber shaped for warm evenings and changing city weather.", tagSlugs: ["woven-detail", "contemporary-african"] },
  { name: "Ivory Weave Tunic", brandSlug: "nkyinkyim-house", artisanSlug: "safia-abdul-rahman", categorySlug: "shirts-and-tops", collectionSlug: "contemporary-ghana", price: 39000, mode: "clothing4", audience: "UNISEX", material: "ivory cotton-linen with narrow handwoven bands", design: "An easy tunic balancing quiet texture with an architectural neckline.", tagSlugs: ["woven-detail", "handcrafted"] },
  { name: "Asaase Tailored Jumpsuit", brandSlug: "nkyinkyim-house", artisanSlug: "ama-serwaa-mensah", categorySlug: "one-pieces", collectionSlug: "ceremony-reimagined", price: 64000, mode: "clothing4", audience: "WOMEN", material: "structured Tencel blend with cotton pocketing", design: "A confident one-piece grounded by an earth palette and precise waist shaping.", tagSlugs: ["occasionwear", "contemporary-african"] },
  { name: "Heritage Fold Overshirt", brandSlug: "nkyinkyim-house", artisanSlug: "safia-abdul-rahman", categorySlug: "outerwear", collectionSlug: "across-ghana-edit", price: 48000, mode: "clothing4", audience: "UNISEX", material: "garment-dyed cotton canvas with woven facing", design: "A versatile overshirt with a folded collar detail informed by heirloom cloth storage.", tagSlugs: ["handcrafted", "everyday"] },

  { name: "Osu City Leather Sandal", brandSlug: "sankofa-steps", artisanSlug: "kwabena-ofori", categorySlug: "footwear", collectionSlug: "city-craft-essentials", price: 28000, mode: "footwear4", audience: "UNISEX", material: "locally finished leather with cushioned rubber sole", design: "An all-day city sandal with broad supportive straps and clean edge finishing.", tagSlugs: ["leather", "everyday"] },
  { name: "Indigo Trail Low-Top", brandSlug: "sankofa-steps", artisanSlug: "kwabena-ofori", categorySlug: "footwear", collectionSlug: "trendify-new-arrivals", price: 46000, mode: "footwear4", audience: "UNISEX", material: "indigo cotton canvas, leather trim, and rubber sole", design: "A relaxed low-top sneaker finished with a narrow woven heel accent.", tagSlugs: ["woven-detail", "everyday"] },
  { name: "Brass Buckle Ahenema Slide", brandSlug: "sankofa-steps", artisanSlug: "kwabena-ofori", categorySlug: "footwear", collectionSlug: "ceremony-reimagined", price: 32000, mode: "footwear4", audience: "UNISEX", material: "finished leather, brushed brass buckle, and low-profile sole", design: "A modern slide that pares ceremonial footwear down to one confident brass detail.", tagSlugs: ["leather", "brass"] },
  { name: "Forest Line Derby Shoe", brandSlug: "sankofa-steps", artisanSlug: "kwabena-ofori", categorySlug: "footwear", collectionSlug: "contemporary-ghana", price: 78000, mode: "footwear4", audience: "MEN", material: "deep forest leather with leather lining and stacked rubber heel", design: "A polished derby with a subtle contrast line suited to work and occasion dressing.", tagSlugs: ["leather", "occasionwear"] },
  { name: "Cape Coast Weekender Bag", brandSlug: "sankofa-steps", artisanSlug: "kwabena-ofori", categorySlug: "bags", collectionSlug: "across-ghana-edit", price: 68000, mode: "colour2", audience: "UNISEX", material: "waxed cotton canvas, leather handles, and cotton lining", design: "A spacious short-trip bag with reinforced corners and a coastal blue lining.", tagSlugs: ["leather", "handcrafted"] },
  { name: "Kumasi Commuter Tote", brandSlug: "sankofa-steps", artisanSlug: "kwabena-ofori", categorySlug: "bags", collectionSlug: "city-craft-essentials", price: 42000, mode: "colour2", audience: "UNISEX", material: "vegetable-tanned leather with woven inner pocket", design: "A sturdy work tote proportioned for a laptop, notebook, and daily market stops.", tagSlugs: ["leather", "everyday"] },
  { name: "Sankofa Crossbody Satchel", brandSlug: "sankofa-steps", artisanSlug: "kwabena-ofori", categorySlug: "bags", collectionSlug: "trendify-new-arrivals", price: 38000, mode: "colour2", audience: "UNISEX", material: "soft-grain leather with brass hardware and cotton lining", design: "A compact satchel with an adjustable strap and a quietly embossed return motif.", tagSlugs: ["leather", "brass"] },
  { name: "Woven Accent Card Wallet", brandSlug: "sankofa-steps", artisanSlug: "safia-abdul-rahman", categorySlug: "accessories", collectionSlug: "city-craft-essentials", price: 16000, mode: "colour2", audience: "UNISEX", material: "leather offcuts with handwoven cotton accent", design: "A slim six-card wallet that gives careful purpose to workshop offcuts.", tagSlugs: ["woven-detail", "everyday"] },

  { name: "Golden Stool Brass Drop Earrings", brandSlug: "ahenema-and-loom", artisanSlug: "esi-nyarko", categorySlug: "jewellery", collectionSlug: "ceremony-reimagined", price: 19000, mode: "accessory2", audience: "WOMEN", material: "hand-shaped recycled brass with hypoallergenic posts", design: "Light-catching drops built from abstracted seat and arch forms.", tagSlugs: ["brass", "handcrafted"] },
  { name: "Ahenema Bead Collar Necklace", brandSlug: "ahenema-and-loom", artisanSlug: "esi-nyarko", categorySlug: "jewellery", collectionSlug: "ceremony-reimagined", price: 29000, mode: "accessory2", audience: "WOMEN", material: "glass beads, brass spacers, and cotton-wrapped cord", design: "A balanced collar necklace arranging rich colour into a modern ceremonial rhythm.", tagSlugs: ["beadwork", "occasionwear"] },
  { name: "Kente Frame Mini Bag", brandSlug: "ahenema-and-loom", artisanSlug: "safia-abdul-rahman", categorySlug: "bags", collectionSlug: "across-ghana-edit", price: 52000, mode: "accessory2", audience: "WOMEN", material: "handwoven cloth, structured frame, and cotton lining", design: "A compact frame bag that showcases one carefully placed woven panel.", tagSlugs: ["woven-detail", "occasionwear"] },
  { name: "Adinkra Cuff Bracelet", brandSlug: "ahenema-and-loom", artisanSlug: "esi-nyarko", categorySlug: "jewellery", collectionSlug: "contemporary-ghana", price: 18000, mode: "accessory2", audience: "UNISEX", material: "recycled brass with hand-brushed finish", design: "An open cuff etched with a restrained continuous geometric rhythm.", tagSlugs: ["brass", "adinkra-inspired"] },
  { name: "Loomline Headwrap", brandSlug: "ahenema-and-loom", artisanSlug: "safia-abdul-rahman", categorySlug: "accessories", collectionSlug: "trendify-new-arrivals", price: 12000, mode: "accessory3", audience: "UNISEX", material: "soft cotton with woven selvedge detail", design: "A generous styling cloth with a fine contrast line running along each edge.", tagSlugs: ["woven-detail", "everyday"] },
  { name: "Celebration Bead Stack", brandSlug: "ahenema-and-loom", artisanSlug: "esi-nyarko", categorySlug: "jewellery", collectionSlug: "ceremony-reimagined", price: 15000, mode: "accessory3", audience: "UNISEX", material: "recycled glass beads with elastic and brass accents", design: "Three coordinated bracelets designed to be worn together or shared.", tagSlugs: ["beadwork", "handcrafted"] },
  { name: "Royal Form Clutch", brandSlug: "ahenema-and-loom", artisanSlug: "esi-nyarko", categorySlug: "bags", collectionSlug: "ceremony-reimagined", price: 44000, mode: "accessory2", audience: "WOMEN", material: "structured textile shell, brass frame, and cotton lining", design: "A sculptural evening clutch with a restrained crown-like frame profile.", tagSlugs: ["brass", "occasionwear"] },
  { name: "Nkyinkyim Silk Scarf", brandSlug: "ahenema-and-loom", artisanSlug: "safia-abdul-rahman", categorySlug: "accessories", collectionSlug: "across-ghana-edit", price: 22000, mode: "accessory3", audience: "UNISEX", material: "silk twill printed with original geometric artwork", design: "A fluid scarf carrying a directional pattern that changes as it is folded.", tagSlugs: ["adinkra-inspired", "contemporary-african"] },
]

export function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export function variantsFor(product: SimulationProduct, productIndex: number) {
  const options = product.mode === "clothing4"
    ? [["S", "Cocoa", "#5C4033"], ["M", "Clay", "#A66A4A"], ["L", "Ivory", "#E8DFC8"], ["XL", "Onyx", "#252525"]]
    : product.mode === "footwear4"
      ? [["40", "Indigo", "#243B64"], ["41", "Forest", "#234D3C"], ["42", "Cocoa", "#5C4033"], ["43", "Black", "#171717"]]
      : product.mode === "colour2"
        ? [[null, "Cocoa", "#5C4033"], [null, "Indigo", "#243B64"]]
        : product.mode === "accessory2"
          ? [["Standard", "Brass", "#B08D35"], ["Compact", "Ebony", "#3D2B1F"]]
          : [["Compact", "Sunset", "#C65D3B"], ["Standard", "Indigo", "#243B64"], ["Extended", "Gold", "#C49A2C"]]
  const code = brands.findIndex((brand) => brand.slug === product.brandSlug) + 1
  return options.map(([sizeLabel, colorName, colorHex], optionIndex) => ({
    sku: `SIM-${code}${String(productIndex + 1).padStart(2, "0")}-${String(optionIndex + 1).padStart(2, "0")}`,
    sizeLabel,
    colorName,
    colorHex,
    pricePesewas: product.price + optionIndex * 1000,
    compareAtPricePesewas: productIndex % 5 === 0 ? product.price + 8000 : null,
    stockQuantity: (productIndex + optionIndex) % 17 === 0 ? 0 : (productIndex + optionIndex) % 9 === 0 ? 3 : 12 + ((productIndex * 3 + optionIndex) % 14),
    lowStockThreshold: 5,
    weightGrams: product.mode === "footwear4" ? 850 : product.categorySlug === "bags" ? 650 : 280,
    active: true,
  }))
}

export const imageSourceFiles = [
  "2 - Shopping and Product Discovery/product_catalogue_desktop/code.html",
  "2 - Shopping and Product Discovery/product_catalogue_mobile/code.html",
  "2 - Shopping and Product Discovery/product_details_desktop/code.html",
  "2 - Shopping and Product Discovery/product_details_mobile/code.html",
  "2 - Shopping and Product Discovery/search_results_desktop/code.html",
  "2 - Shopping and Product Discovery/search_results_mobile/code.html",
  "1- Public Storefront/collections_desktop/code.html",
  "1- Public Storefront/homepage_desktop/code.html",
  "1- Public Storefront/about_us_desktop/code.html",
] as const
