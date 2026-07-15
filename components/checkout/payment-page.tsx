"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { toast } from "sonner"

import { CheckoutSteps } from "@/components/checkout/checkout-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { readCheckoutSession, writeCheckoutSession } from "@/lib/checkout-session"
import { formatPesewas } from "@/lib/utils"
import { useInitializePaystack } from "@/services/payments/payments"

export function PaymentPage() {
  const router = useRouter()
  const session = readCheckoutSession()
  const order = session.order
  const initialize = useInitializePaystack()
  const [channel, setChannel] = useState<"MOBILE_MONEY" | "CARD" | "BANK_TRANSFER">("MOBILE_MONEY")
  const [network, setNetwork] = useState("MTN")
  const [phone, setPhone] = useState(session.input.phone || "")
  const [name, setName] = useState(session.input.customerName || "")
  if (!order) return <main className="page-shell grid min-h-[60vh] place-items-center text-center"><div><h1 className="type-headline-lg">No order is awaiting payment</h1><Button className="mt-5" render={<Link href="/cart"/>}>Return to your bag</Button></div></main>
  const pay = () => initialize.mutate({ orderId: order.orderId, channel, mobileMoneyNetwork: channel === "MOBILE_MONEY" ? network : undefined, payerPhone: channel === "MOBILE_MONEY" ? phone : undefined, payerName: name, guestAccessToken: order.guestAccessToken }, { onSuccess: (payment) => { writeCheckoutSession({ paymentReference: payment.reference }); window.location.assign(payment.authorizationUrl) }, onError: (error) => toast.error(error.message) })
  return <main className="page-shell py-10 sm:py-14"><CheckoutSteps current={3}/><div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_360px]"><section className="border border-outline-variant bg-white p-6 sm:p-8"><h1 className="type-headline-lg">Secure payment</h1><p className="mt-3 text-muted-foreground">Choose a payment route. Paystack will complete the authorization securely.</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{[["MOBILE_MONEY", "Mobile Money"], ["CARD", "Card"], ["BANK_TRANSFER", "Bank transfer"]].map(([value, label]) => <button key={value} className={`border p-5 text-sm font-semibold ${channel === value ? "border-kente-gold bg-surface-container" : "border-outline-variant"}`} onClick={() => setChannel(value as typeof channel)}>{label}</button>)}</div>{channel === "MOBILE_MONEY" && <div className="mt-8 space-y-5"><div className="grid grid-cols-3 gap-3">{["MTN", "TELECEL", "AIRTELTIGO"].map((value) => <button key={value} className={`border p-4 text-xs font-bold ${network === value ? "border-kente-gold bg-surface-container" : "border-outline-variant"}`} onClick={() => setNetwork(value)}>{value}</button>)}</div><label className="block text-sm font-medium">Mobile Money phone<Input className="mt-2" value={phone} onChange={(event) => setPhone(event.target.value)}/></label><label className="block text-sm font-medium">Account-holder name<Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)}/></label></div>}<div className="mt-8 border-l-4 border-kente-gold bg-surface-container p-5 text-sm"><strong>What happens next</strong><p className="mt-2 text-muted-foreground">You will continue to Paystack. Follow the secure instructions there, then return automatically for server verification.</p></div><Button size="lg" className="mt-8 w-full" onClick={pay} disabled={initialize.isPending || (channel === "MOBILE_MONEY" && (!phone || !name))}>{initialize.isPending ? "Opening Paystack…" : "Continue to secure payment"}</Button><Button variant="outline" size="lg" className="mt-3 w-full" onClick={() => router.push("/checkout/review")}>Back to review</Button></section><aside className="h-fit bg-surface-container p-6"><h2 className="type-headline-md">Transaction details</h2><div className="mt-6 space-y-4 text-sm"><Row label="Subtotal" value={order.subtotalPesewas}/>{order.discountPesewas > 0 && <Row label="Discount" value={-order.discountPesewas}/>}<Row label="Tax" value={order.taxPesewas}/><Row label="Delivery" value={order.deliveryFeePesewas}/><div className="flex justify-between border-t border-outline-variant pt-4 font-heading text-xl font-semibold"><span>Total</span><span>{formatPesewas(order.totalPesewas)}</span></div></div><p className="mt-6 flex gap-2 text-xs text-muted-foreground"><Lock className="size-3"/> Order {order.orderNumber}</p></aside></div></main>
}

function Row({ label, value }: { label: string; value: number }) { return <div className="flex justify-between"><span>{label}</span><span className={value < 0 ? "text-error" : ""}>{value < 0 ? "−" : ""}{formatPesewas(Math.abs(value))}</span></div> }
