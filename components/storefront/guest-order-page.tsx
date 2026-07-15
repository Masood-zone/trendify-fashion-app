"use client"

import Image from "next/image"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import api from "@/lib/axios"
import { formatDate, formatPesewas } from "@/lib/utils"
import { storefrontRequest } from "@/services/storefront/storefront"
import type { CustomerOrderDetail } from "@/types/customer"

export function GuestOrderPage({ orderNumber }: { orderNumber: string }) {
  const [access] = useState<{
    orderNumber: string
    guestAccessToken: string
  } | null>(() => {
    if (typeof window === "undefined") return null
    try {
      return JSON.parse(
        sessionStorage.getItem("trendify_last_order_access") || "null"
      )
    } catch {
      return null
    }
  })
  const order = useQuery({
    queryKey: ["guest-order", orderNumber],
    enabled: Boolean(
      access?.guestAccessToken && access.orderNumber === orderNumber
    ),
    queryFn: () =>
      storefrontRequest<CustomerOrderDetail>(
        api.post("/storefront/orders/lookup", {
          orderNumber,
          guestAccessToken: access!.guestAccessToken,
        }),
        "Order could not be loaded"
      ),
  })
  if (!access || access.orderNumber !== orderNumber)
    return (
      <main className="page-shell grid min-h-[60vh] place-items-center text-center">
        <div>
          <h1 className="type-headline-lg">Order access is unavailable</h1>
          <p className="mt-3 text-muted-foreground">
            For security, guest order access remains in the browser that
            completed checkout.
          </p>
          <Button className="mt-6" render={<Link href="/support" />}>
            Contact support
          </Button>
        </div>
      </main>
    )
  if (order.isLoading)
    return (
      <div className="page-shell min-h-[60vh] animate-pulse py-16">
        <div className="h-80 bg-surface-container" />
      </div>
    )
  if (!order.data)
    return (
      <main className="page-shell grid min-h-[60vh] place-items-center">
        Order could not be loaded.
      </main>
    )
  return (
    <main className="page-shell py-16">
      <div className="flex flex-col justify-between gap-4 border-b border-outline-variant pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="type-label text-on-tertiary-container">Guest order</p>
          <h1 className="type-headline-lg mt-2">{order.data.orderNumber}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Placed {formatDate(order.data.createdAt)}
          </p>
        </div>
        <span className="bg-surface-container px-4 py-2 text-sm font-semibold">
          {order.data.status.replaceAll("_", " ")}
        </span>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="type-headline-md">Tracking</h2>
          <div className="mt-5 space-y-0">
            {order.data.events.map((event) => (
              <div
                key={event.id}
                className="relative border-l border-outline-variant pb-7 pl-7 before:absolute before:top-1 before:-left-1.5 before:size-3 before:rounded-full before:bg-primary"
              >
                <p className="font-semibold">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(event.occurredAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {event.description && (
                  <p className="mt-2 text-sm">{event.description}</p>
                )}
              </div>
            ))}
          </div>
          <h2 className="type-headline-md mt-6">Items</h2>
          <div className="divide-y divide-outline-variant">
            {order.data.items.map((item) => (
              <div key={item.id} className="flex gap-4 py-5">
                {item.imageUrl && (
                  <div className="relative size-20">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.size || "One size"} · {item.color || "Default"} · Qty{" "}
                    {item.quantity}
                  </p>
                </div>
                <span>{formatPesewas(item.lineTotalPesewas)}</span>
              </div>
            ))}
          </div>
        </section>
        <aside className="h-fit bg-surface-container p-6">
          <h2 className="type-headline-md">Order total</h2>
          <p className="mt-6 font-heading text-3xl font-semibold">
            {formatPesewas(order.data.totalPesewas)}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {order.data.deliveryMethodName}
          </p>
          <p className="mt-6 text-sm leading-6">
            {order.data.deliveryAddress.join(", ")}
          </p>
        </aside>
      </div>
    </main>
  )
}
