import type { Metadata } from "next"
import { Geist_Mono, Manrope, Playfair_Display } from "next/font/google"
import { cn } from "@/lib/utils"

import "./globals.css"
import { Providers } from "@/components/providers/providers"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Fashion Trendify GH | Modern Ghanaian Heritage",
  description:
    "Contemporary Ghanaian fashion, local craftsmanship, and global style rooted in heritage.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        manrope.variable,
        playfairDisplay.variable,
        geistMono.variable
      )}
    >
      <head>
        <meta charSet="utf-8" />
        {/* Prototype icon fonts */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
