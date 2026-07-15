import type { ReactNode } from "react"
import { CheckoutShell } from "@/components/checkout/checkout-shell"

export default function Layout({ children }: { children: ReactNode }) { return <CheckoutShell>{children}</CheckoutShell> }
