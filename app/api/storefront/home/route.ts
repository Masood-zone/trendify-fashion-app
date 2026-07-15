import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import {
  publicProductInclude,
  publicProductWhere,
  publishedContentWhere,
  serializeProductCard,
} from "@/services/storefront/catalog"
import { parseCheckoutConfig } from "@/services/storefront/settings"

export async function GET() {
  try {
    const [sections, settings] = await Promise.all([
      prisma.homepageSection.findMany({
        where: { ...publishedContentWhere, enabled: true },
        include: {
          mediaAsset: true,
          items: { orderBy: { sortOrder: "asc" } },
          products: {
            where: { product: publicProductWhere },
            include: { product: { include: publicProductInclude } },
            orderBy: { sortOrder: "asc" },
          },
          categories: {
            where: { category: { active: true, deletedAt: null } },
            include: { category: true },
            orderBy: { sortOrder: "asc" },
          },
          collections: {
            where: { collection: publishedContentWhere },
            include: { collection: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.storeSettings.findUnique({ where: { key: "default" } }),
    ])
    return ok({
      sections: sections.map((section) => ({
        id: section.id,
        key: section.key,
        type: section.type,
        eyebrow: section.eyebrow,
        heading: section.heading,
        body: section.body,
        ctaLabel: section.ctaLabel,
        ctaHref: section.ctaHref,
        image: section.mediaAsset
          ? {
              id: section.mediaAsset.id,
              url: section.mediaAsset.secureUrl,
              altText:
                section.mediaAsset.altText ||
                section.heading ||
                "Homepage editorial image",
              primary: true,
            }
          : null,
        config:
          section.config && typeof section.config === "object"
            ? (section.config as Record<string, unknown>)
            : {},
        items: section.items.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          icon: item.icon,
          imageUrl: item.imageUrl,
          href: item.href,
        })),
        products: section.products.map(({ product }) =>
          serializeProductCard(product)
        ),
        categories: section.categories.map(({ category }) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          featured: category.featured,
        })),
        collections: section.collections.map(({ collection }) => ({
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          imageUrl: collection.imageUrl,
          featured: collection.featured,
        })),
      })),
      settings: {
        brandName: settings?.brandName || "Fashion Trendify GH",
        supportEmail: settings?.supportEmail ?? null,
        supportPhone: settings?.supportPhone ?? null,
        whatsappNumber: settings?.whatsappNumber ?? null,
        address: settings?.address ?? null,
        socialLinks:
          settings?.socialLinks && typeof settings.socialLinks === "object"
            ? (settings.socialLinks as Record<string, string>)
            : {},
        checkoutConfig: parseCheckoutConfig(settings?.checkoutConfig),
      },
    })
  } catch (error) {
    return serverError(error)
  }
}
