"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Truck } from "lucide-react"
import { toast } from "sonner"

import { CheckoutSteps } from "@/components/checkout/checkout-shell"
import { Button } from "@/components/ui/button"
import {
  readCheckoutSession,
  writeCheckoutSession,
} from "@/lib/checkout-session"
import { formatPesewas } from "@/lib/utils"
import {
  useCart,
  useCreateOrder,
  useDeliveryMethods,
  useValidateCheckout,
} from "@/services/storefront/storefront"
import type { CheckoutInput } from "@/types/storefront"

export function ReviewPage() {
  const router = useRouter()
  const [input, setInput] = useState<Partial<CheckoutInput>>(
    () => readCheckoutSession().input
  )
  const cart = useCart()
  const methods = useDeliveryMethods(input.deliveryRegion)
  const quote = useValidateCheckout()
  const create = useCreateOrder()
  useEffect(() => {
    if (!input.customerName || !input.deliveryStreetAddress)
      router.replace("/checkout/delivery")
  }, [input, router])
  useEffect(() => {
    if (!input.deliveryMethodCode) return
    quote.mutate(input as CheckoutInput, {
      onSuccess: (value) => writeCheckoutSession({ input, quote: value }),
    })
    // Recalculate only when the server-relevant delivery selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.deliveryMethodCode])
  const continueToPayment = () => {
    if (!input.deliveryMethodCode)
      return toast.error("Choose a delivery method")
    const existing = readCheckoutSession().order
    if (existing) return router.push("/checkout/payment")
    create.mutate(input as CheckoutInput, {
      onSuccess: (order) => {
        writeCheckoutSession({ input, quote: order, order })
        router.push("/checkout/payment")
      },
      onError: (error) => toast.error(error.message),
    })
  }
  return (
    <main className="page-shell py-10 sm:py-14">
      <CheckoutSteps current={2} />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="flex items-end justify-between border-b border-outline-variant pb-3">
            <h1 className="type-headline-lg">Information review</h1>
            <Link href="/checkout/delivery" className="text-sm underline">
              Edit
            </Link>
          </div>
          <div className="mt-5 grid gap-6 border border-outline-variant bg-white p-6 sm:grid-cols-2">
            <div>
              <p className="type-label">Contact</p>
              <p className="mt-3">{input.customerName}</p>
              <p className="text-sm text-muted-foreground">{input.email}</p>
              <p className="text-sm text-muted-foreground">{input.phone}</p>
            </div>
            <div>
              <p className="type-label">Delivery address</p>
              <p className="mt-3">{input.deliveryStreetAddress}</p>
              <p className="text-sm text-muted-foreground">
                {[
                  input.deliveryAreaSuburb,
                  input.deliveryCityTown,
                  input.deliveryRegion,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
          <h2 className="type-headline-md mt-10 border-b border-outline-variant pb-3">
            Delivery method
          </h2>
          <div className="mt-4 space-y-3">
            {methods.isLoading ? (
              <div className="h-24 animate-pulse bg-surface-container" />
            ) : methods.data?.length ? (
              methods.data.map((method) => (
                <button
                  key={method.id}
                  onClick={() => {
                    const next = { ...input, deliveryMethodCode: method.code }
                    setInput(next)
                    writeCheckoutSession({ input: next })
                  }}
                  className={`flex w-full items-center justify-between border p-5 text-left ${input.deliveryMethodCode === method.code ? "border-primary bg-surface-container-low" : "border-outline-variant bg-white"}`}
                >
                  <span className="flex gap-3">
                    <Truck className="size-5" />
                    <span>
                      <strong className="block">{method.name}</strong>
                      <small className="text-muted-foreground">
                        {method.description ||
                          `${method.estimatedMinDays}–${method.estimatedMaxDays} business days`}
                      </small>
                    </span>
                  </span>
                  <span className="font-semibold">
                    {method.feePesewas
                      ? formatPesewas(method.feePesewas)
                      : "Free"}
                  </span>
                </button>
              ))
            ) : (
              <p className="border border-error p-5 text-error">
                No delivery method is available for this region.
              </p>
            )}
          </div>
          <h2 className="type-headline-md mt-10 border-b border-outline-variant pb-3">
            Order items
          </h2>
          <div className="divide-y divide-outline-variant">
            {cart.data?.items.map((line) => (
              <div key={line.id} className="flex items-center gap-4 py-5">
                {line.variant.product.media[0] && (
                  <div className="relative size-20 shrink-0">
                    <Image
                      src={line.variant.product.media[0].url}
                      alt={line.variant.product.media[0].altText}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">{line.variant.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.variant.sizeLabel || "One size"} ·{" "}
                    {line.variant.colorName || "Default"} · Qty {line.quantity}
                  </p>
                </div>
                <span>{formatPesewas(line.lineTotalPesewas)}</span>
              </div>
            ))}
          </div>
        </section>
        <aside className="h-fit border border-outline-variant bg-white p-6 lg:sticky lg:top-8">
          <h2 className="type-headline-md">Order summary</h2>
          {quote.isPending ? (
            <div className="mt-6 h-32 animate-pulse bg-surface-container" />
          ) : quote.data ? (
            <div className="mt-6 space-y-4 text-sm">
              <Row label="Subtotal" value={quote.data.subtotalPesewas} />
              {quote.data.discountPesewas > 0 && (
                <Row label="Discount" value={-quote.data.discountPesewas} />
              )}
              <Row label="Tax" value={quote.data.taxPesewas} />
              <Row label="Delivery" value={quote.data.deliveryFeePesewas} />
              <div className="flex justify-between border-t border-outline-variant pt-4 font-heading text-xl font-semibold">
                <span>Total payable</span>
                <span>{formatPesewas(quote.data.totalPesewas)}</span>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Choose a delivery method to calculate the final total.
            </p>
          )}
          <Button
            size="lg"
            className="mt-7 w-full"
            disabled={!quote.data || create.isPending}
            onClick={continueToPayment}
          >
            {create.isPending
              ? "Creating secure order…"
              : "Continue to payment"}
          </Button>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Check className="size-3" /> Server-validated totals
          </p>
        </aside>
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={value < 0 ? "text-error" : ""}>
        {value < 0 ? "−" : ""}
        {formatPesewas(Math.abs(value))}
      </span>
    </div>
  )
}
