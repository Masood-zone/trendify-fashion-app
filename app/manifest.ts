import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fashion Trendify GH",
    short_name: "Trendify GH",
    description:
      "Contemporary Ghanaian fashion, local craftsmanship, and global style rooted in heritage.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff8f2",
    theme_color: "#6f1d2c",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
