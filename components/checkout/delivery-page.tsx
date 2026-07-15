"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { CheckoutSteps } from "@/components/checkout/checkout-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import { useSession } from "@/lib/auth-client"
import {
  GHANA_REGIONS,
  readCheckoutSession,
  writeCheckoutSession,
} from "@/lib/checkout-session"
import { storefrontRequest, useCart } from "@/services/storefront/storefront"
import type { CustomerAddressData, CustomerProfileData } from "@/types/customer"
import type { CheckoutInput } from "@/types/storefront"

const blank: Partial<CheckoutInput> = {
  customerName: "",
  email: "",
  phone: "",
  alternatePhone: "",
  deliveryRegion: "",
  deliveryCityTown: "",
  deliveryAreaSuburb: "",
  deliveryGhanaPostGps: "",
  deliveryStreetAddress: "",
  deliveryNearbyLandmark: "",
  deliveryInstructions: "",
  deliveryMethodCode: "",
}

export function DeliveryPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const cart = useCart()
  const [draft, setDraft] = useState<Partial<CheckoutInput>>(() => ({
    ...blank,
    ...readCheckoutSession().input,
  }))
  const [saveAddress, setSaveAddress] = useState(false)
  const profile = useQuery({
    queryKey: ["customer", "profile"],
    enabled: Boolean(session),
    queryFn: () =>
      storefrontRequest<CustomerProfileData>(
        api.get("/customer/profile"),
        "Profile could not be loaded"
      ),
  })
  const addresses = useQuery({
    queryKey: ["customer", "addresses"],
    enabled: Boolean(session),
    queryFn: () =>
      storefrontRequest<CustomerAddressData[]>(
        api.get("/customer/addresses"),
        "Addresses could not be loaded"
      ),
  })
  const defaultAddress = addresses.data?.find((item) => item.isDefault)
  const form = useMemo<Partial<CheckoutInput>>(
    () => ({
      ...draft,
      customerName: draft.customerName || profile.data?.name || "",
      email: draft.email || profile.data?.email || "",
      phone:
        draft.phone || profile.data?.phoneNumber || defaultAddress?.phone || "",
      deliveryRegion:
        draft.deliveryRegion || defaultAddress?.region || "Greater Accra",
      deliveryCityTown:
        draft.deliveryCityTown || defaultAddress?.cityTown || "",
      deliveryAreaSuburb:
        draft.deliveryAreaSuburb || defaultAddress?.areaSuburb || "",
      deliveryGhanaPostGps:
        draft.deliveryGhanaPostGps || defaultAddress?.ghanaPostGps || "",
      deliveryStreetAddress:
        draft.deliveryStreetAddress || defaultAddress?.streetAddress || "",
      deliveryNearbyLandmark:
        draft.deliveryNearbyLandmark || defaultAddress?.nearbyLandmark || "",
      deliveryInstructions:
        draft.deliveryInstructions ||
        defaultAddress?.deliveryInstructions ||
        "",
    }),
    [defaultAddress, draft, profile.data]
  )
  useEffect(() => {
    if (!cart.isLoading && !cart.data?.items.length) router.replace("/cart")
  }, [cart.data?.items.length, cart.isLoading, router])
  const set = (key: keyof CheckoutInput, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }))
  if (!cart.isLoading && !cart.data?.items.length) return null
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const input = {
      ...form,
      promotionCode:
        sessionStorage.getItem("trendify_promotion_code") || undefined,
    } as CheckoutInput
    writeCheckoutSession({ input })
    if (saveAddress && session) {
      try {
        await api.post("/customer/addresses", {
          label: "Checkout",
          recipientName: input.customerName,
          phone: input.phone,
          alternatePhone: input.alternatePhone || undefined,
          region: input.deliveryRegion,
          cityTown: input.deliveryCityTown,
          areaSuburb: input.deliveryAreaSuburb || undefined,
          ghanaPostGps: input.deliveryGhanaPostGps || undefined,
          streetAddress: input.deliveryStreetAddress,
          nearbyLandmark: input.deliveryNearbyLandmark || undefined,
          deliveryInstructions: input.deliveryInstructions || undefined,
          isDefault: !addresses.data?.length,
        })
      } catch {
        toast.error("Checkout can continue, but the address could not be saved")
      }
    }
    router.push("/checkout/review")
  }
  return (
    <main className="page-shell py-10 sm:py-14">
      <CheckoutSteps current={1} />
      <div className="mx-auto max-w-4xl">
        <h1 className="type-headline-lg">Contact and delivery</h1>
        <p className="mt-2 text-muted-foreground">
          We use these details only to fulfil this order.
        </p>
        <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
          <Field label="Full name">
            <Input
              required
              value={form.customerName || ""}
              onChange={(event) => set("customerName", event.target.value)}
            />
          </Field>
          <Field label="Email address">
            <Input
              required
              type="email"
              value={form.email || ""}
              onChange={(event) => set("email", event.target.value)}
            />
          </Field>
          <Field label="Phone number">
            <Input
              required
              value={form.phone || ""}
              onChange={(event) => set("phone", event.target.value)}
            />
          </Field>
          <Field label="Alternate phone (optional)">
            <Input
              value={form.alternatePhone || ""}
              onChange={(event) => set("alternatePhone", event.target.value)}
            />
          </Field>
          <Field label="Region">
            <select
              required
              className="h-11 w-full border border-outline-variant bg-white px-3"
              value={form.deliveryRegion}
              onChange={(event) => set("deliveryRegion", event.target.value)}
            >
              {GHANA_REGIONS.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </Field>
          <Field label="City / town">
            <Input
              required
              value={form.deliveryCityTown || ""}
              onChange={(event) => set("deliveryCityTown", event.target.value)}
            />
          </Field>
          <Field label="Area / suburb">
            <Input
              value={form.deliveryAreaSuburb || ""}
              onChange={(event) =>
                set("deliveryAreaSuburb", event.target.value)
              }
            />
          </Field>
          <Field label="GhanaPost GPS">
            <Input
              value={form.deliveryGhanaPostGps || ""}
              onChange={(event) =>
                set("deliveryGhanaPostGps", event.target.value)
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Street address">
              <Input
                required
                value={form.deliveryStreetAddress || ""}
                onChange={(event) =>
                  set("deliveryStreetAddress", event.target.value)
                }
              />
            </Field>
          </div>
          <Field label="Nearby landmark">
            <Input
              value={form.deliveryNearbyLandmark || ""}
              onChange={(event) =>
                set("deliveryNearbyLandmark", event.target.value)
              }
            />
          </Field>
          {session && (
            <label className="flex items-end gap-3 pb-3 text-sm">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(event) => setSaveAddress(event.target.checked)}
              />{" "}
              Save this address
            </label>
          )}
          <label className="text-sm font-medium sm:col-span-2">
            Delivery instructions
            <textarea
              className="mt-2 min-h-28 w-full border border-outline-variant bg-white p-3"
              value={form.deliveryInstructions || ""}
              onChange={(event) =>
                set("deliveryInstructions", event.target.value)
              }
            />
          </label>
          <Button
            type="submit"
            size="lg"
            className="mt-3 sm:col-span-2 sm:w-fit"
          >
            Continue to review
          </Button>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  )
}
