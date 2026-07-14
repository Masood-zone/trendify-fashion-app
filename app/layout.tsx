import type { Metadata } from "next"
import { Geist_Mono, Manrope, Playfair_Display } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

import "./globals.css"

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
      <body>
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      </body>
    </html>
  )
}
