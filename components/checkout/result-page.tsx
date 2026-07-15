"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Clock3, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { clearCheckoutSession, readCheckoutSession } from "@/lib/checkout-session"
import { useVerifyPaystack } from "@/services/payments/payments"

export function ResultPage() {
  const params = useSearchParams()
  const checkout = readCheckoutSession()
  const reference = params.get("reference") || params.get("trxref") || checkout.paymentReference
  const verify = useVerifyPaystack()
  const started = useRef(false)
  useEffect(() => {
    if (!reference || started.current) return
    started.current = true
    verify.mutate({ reference, guestAccessToken: checkout.order?.guestAccessToken }, { onSuccess: (result) => {
      if (!result.confirmed) return
      if (checkout.order?.guestAccessToken) sessionStorage.setItem("trendify_last_order_access", JSON.stringify({ orderNumber: result.orderNumber, guestAccessToken: checkout.order.guestAccessToken }))
      clearCheckoutSession()
      sessionStorage.removeItem("trendify_promotion_code")
    } })
    // Payment verification is intentionally started once per callback load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference])
  if (!reference) return <ResultState icon={XCircle} title="Payment reference missing" detail="Return to your bag and start payment again."><Button render={<Link href="/cart"/>}>Return to bag</Button></ResultState>
  if (verify.isPending || !verify.data) return <ResultState icon={Clock3} title="Verifying your payment" detail="Please keep this page open while Trendify confirms the transaction directly with Paystack."/>
  if (verify.data.confirmed) return <ResultState icon={CheckCircle2} title="Payment confirmed" detail={`Your order ${verify.data.orderNumber} is confirmed and has entered fulfilment.`}><Button render={<Link href={checkout.order?.guestAccessToken ? `/orders/${verify.data.orderNumber}` : `/account/orders/${verify.data.orderNumber}`}/>}>View order</Button><Button variant="outline" render={<Link href="/shop"/>}>Continue shopping</Button></ResultState>
  if (verify.data.paymentStatus === "PENDING" || verify.data.paymentStatus === "INITIALIZED") return <ResultState icon={Clock3} title="Payment is still pending" detail="Paystack has not confirmed the payment yet. You can safely refresh its status."><Button onClick={() => verify.mutate({ reference, guestAccessToken: checkout.order?.guestAccessToken })}>Refresh status</Button><Button variant="outline" render={<Link href="/support"/>}>Contact support</Button></ResultState>
  return <ResultState icon={XCircle} title="Payment was not completed" detail="Your order was not marked as paid. Reserved stock will be released according to the checkout window."><Button render={<Link href="/checkout/payment"/>}>Try payment again</Button><Button variant="outline" render={<Link href="/support"/>}>Contact support</Button></ResultState>
}

function ResultState({ icon: Icon, title, detail, children }: { icon: typeof CheckCircle2; title: string; detail: string; children?: React.ReactNode }) { return <main className="page-shell grid min-h-[65vh] place-items-center py-16"><div className="max-w-xl text-center"><Icon className="mx-auto size-16" strokeWidth={1.25}/><h1 className="type-display mt-7">{title}</h1><p className="mx-auto mt-4 max-w-lg leading-7 text-muted-foreground">{detail}</p>{children && <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">{children}</div>}</div></main> }
