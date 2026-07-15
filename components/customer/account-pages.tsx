"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Package, Heart, MapPin, ArrowRight, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ProductCard } from "@/components/storefront/product-card"
import { PhoneVerificationPanel } from "@/components/customer/phone-verification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import api from "@/lib/axios"
import { formatDate, formatPesewas } from "@/lib/utils"
import { storefrontRequest } from "@/services/storefront/storefront"
import type { CustomerAddressData, CustomerDashboardData, CustomerOrderDetail, CustomerOrderPage, CustomerProfileData } from "@/types/customer"
import type { ProductListItem } from "@/types/storefront"

function PageHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) { return <div className="mb-8"><p className="type-label text-on-tertiary-container">{eyebrow}</p><h1 className="type-display mt-2">{title}</h1><p className="mt-3 max-w-3xl text-muted-foreground">{detail}</p></div> }
function Loading() { return <div className="h-72 animate-pulse bg-surface-container"/> }

export function AccountDashboard() {
  const dashboard = useQuery({ queryKey: ["customer", "dashboard"], queryFn: () => storefrontRequest<CustomerDashboardData>(api.get("/customer/dashboard"), "Dashboard could not be loaded") })
  const profile = useQuery({ queryKey: ["customer", "profile"], queryFn: () => storefrontRequest<CustomerProfileData>(api.get("/customer/profile"), "Profile could not be loaded") })
  return <main className="page-shell py-10 pb-24 md:py-14"><PageHeader eyebrow="Customer account" title={`Akwaaba${profile.data?.firstName ? `, ${profile.data.firstName}` : ""}`} detail="Manage your orders, saved pieces, addresses, and account details from one place."/>{dashboard.isLoading ? <Loading/> : dashboard.data && <><section className="grid gap-4 sm:grid-cols-3"><Metric icon={Package} label="Total orders" value={String(dashboard.data.orderCount)}/><Metric icon={Heart} label="Saved pieces" value={String(dashboard.data.wishlistCount)}/><Metric icon={MapPin} label="Default delivery" value={dashboard.data.defaultAddress ? dashboard.data.defaultAddress.cityTown : "Not set"}/></section><section className="mt-10 grid gap-6 lg:grid-cols-[1fr_300px]"><div><div className="mb-4 flex justify-between"><h2 className="type-headline-md">Recent orders</h2><Link href="/account/orders" className="text-sm underline">View all</Link></div>{dashboard.data.recentOrders.length ? <div className="space-y-3">{dashboard.data.recentOrders.map((order) => <Link key={order.id} href={`/account/orders/${order.orderNumber}`} className="flex items-center justify-between border border-outline-variant bg-white p-5"><div><p className="font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(order.createdAt)} · {order.status.replaceAll("_", " ")}</p></div><div className="flex items-center gap-3"><span>{formatPesewas(order.totalPesewas)}</span><ArrowRight className="size-4"/></div></Link>)}</div> : <Empty title="No orders yet" href="/shop" action="Start shopping"/>}</div><aside className="bg-primary p-6 text-white"><p className="type-label text-primary-fixed-dim">Your details</p><h2 className="mt-4 font-heading text-xl">{profile.data?.name}</h2><p className="mt-2 text-sm text-primary-fixed-dim">{profile.data?.email}</p><Button className="mt-8 w-full" variant="secondary" render={<Link href="/account/settings"/>}>Edit account</Button></aside></section></>}</main>
}

function Metric({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) { return <div className="border border-outline-variant bg-white p-6"><Icon className="size-5"/><p className="type-label mt-5 text-muted-foreground">{label}</p><p className="mt-2 font-heading text-2xl font-semibold">{value}</p></div> }

export function OrdersPage() {
  const [status, setStatus] = useState("ALL")
  const orders = useQuery({ queryKey: ["customer", "orders"], queryFn: () => storefrontRequest<CustomerOrderPage>(api.get("/customer/orders"), "Orders could not be loaded") })
  const visible = orders.data?.items.filter((order) => status === "ALL" || order.status === status) ?? []
  return <main className="page-shell py-10 pb-24 md:py-14"><PageHeader eyebrow="Customer account" title="My Orders" detail="Track your pieces from confirmed payment through delivery."/><div className="mb-7 flex gap-2 overflow-x-auto border-b border-outline-variant">{[["ALL", "All orders"], ["PROCESSING", "Processing"], ["SHIPPED", "Shipped"], ["DELIVERED", "Delivered"]].map(([value, label]) => <button key={value} onClick={() => setStatus(value)} className={`whitespace-nowrap px-4 py-3 text-sm ${status === value ? "border-b-2 border-primary font-semibold" : "text-muted-foreground"}`}>{label}</button>)}</div>{orders.isLoading ? <Loading/> : visible.length ? <div className="space-y-5">{visible.map((order) => <article key={order.id} className="grid gap-5 border border-outline-variant bg-white p-6 sm:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-3"><span className="bg-surface-container px-3 py-2 text-xs font-semibold">{order.status.replaceAll("_", " ")}</span><span className="font-semibold">{order.orderNumber}</span><span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span></div><div className="mt-5 flex -space-x-3">{order.items.slice(0, 3).map((item) => item.imageUrl && <div key={item.id} className="relative size-20 overflow-hidden border-2 border-white"><Image src={item.imageUrl} alt={item.productName} fill className="object-cover"/></div>)}</div><p className="mt-5 font-heading text-xl">{formatPesewas(order.totalPesewas)}</p><p className="mt-1 text-sm text-on-tertiary-container">{order.paymentStatus ? `Payment ${order.paymentStatus.toLowerCase()}` : "No completed payment"}</p></div><div className="flex flex-col justify-center gap-3"><Button render={<Link href={`/account/orders/${order.orderNumber}`}/>}>View and track</Button></div></article>)}</div> : <Empty title="No matching orders" href="/shop" action="Browse the shop"/>}</main>
}

export function OrderDetailPage({ orderNumber }: { orderNumber: string }) {
  const order = useQuery({ queryKey: ["customer", "order", orderNumber], queryFn: () => storefrontRequest<CustomerOrderDetail>(api.get(`/customer/orders/${encodeURIComponent(orderNumber)}`), "Order could not be loaded") })
  if (order.isLoading) return <main className="page-shell py-14"><Loading/></main>
  if (!order.data) return <main className="page-shell py-14"><Empty title="Order not found" href="/account/orders" action="Back to orders"/></main>
  const item = order.data
  return <main className="page-shell py-10 pb-24 md:py-14"><div className="flex flex-col justify-between gap-4 border-b border-outline-variant pb-6 sm:flex-row sm:items-end"><div><p className="type-label text-on-tertiary-container">Order details</p><h1 className="type-headline-lg mt-2">{item.orderNumber}</h1><p className="mt-2 text-sm text-muted-foreground">{formatDate(item.createdAt)} · {item.status.replaceAll("_", " ")}</p></div><Button variant="outline" render={<Link href="/support"/>}>Contact support</Button></div><section className="mt-8 bg-surface-container p-6"><h2 className="type-headline-md">Tracking status</h2><div className="mt-7 grid gap-6 sm:grid-cols-3 lg:grid-cols-6">{item.events.map((event) => <div key={event.id} className="border-l-2 border-primary pl-4"><p className="text-sm font-semibold">{event.title}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(event.occurredAt, { dateStyle: "medium", timeStyle: "short" })}</p></div>)}</div></section><div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]"><section><h2 className="type-headline-md border-b border-outline-variant pb-3">Items summary</h2><div className="divide-y divide-outline-variant">{item.items.map((line) => <div key={line.id} className="flex gap-5 py-6">{line.imageUrl && <div className="relative size-28 shrink-0"><Image src={line.imageUrl} alt={line.productName} fill className="object-cover"/></div>}<div className="flex-1"><Link href={`/products/${line.productSlug}`} className="font-heading text-xl font-semibold">{line.productName}</Link><p className="mt-2 text-xs text-muted-foreground">{line.size || "One size"} · {line.color || "Default"} · Qty {line.quantity}</p><p className="mt-4">{formatPesewas(line.lineTotalPesewas)}</p>{item.status === "DELIVERED" && !line.reviewId && <Button className="mt-4" size="sm" variant="outline" render={<Link href={`/products/${line.productSlug}?reviewOrderItem=${line.id}#details`}/>}>Write a review</Button>}</div></div>)}</div></section><aside className="space-y-5"><div className="border border-outline-variant bg-white p-5"><p className="type-label">Delivery address</p><p className="mt-4 text-sm leading-6">{item.customerName}<br/>{item.deliveryAddress.join(", ")}<br/>{item.phone}</p></div><div className="bg-surface-container p-5"><p className="type-label">Price breakdown</p><div className="mt-4 space-y-3 text-sm"><Money label="Subtotal" value={item.subtotalPesewas}/><Money label="Discount" value={-item.discountPesewas}/><Money label="Tax" value={item.taxPesewas}/><Money label="Delivery" value={item.deliveryFeePesewas}/><div className="flex justify-between border-t border-outline-variant pt-4 font-heading text-xl"><span>Total</span><span>{formatPesewas(item.totalPesewas)}</span></div></div></div></aside></div></main>
}

function Money({ label, value }: { label: string; value: number }) { return <div className="flex justify-between"><span>{label}</span><span>{value < 0 ? "−" : ""}{formatPesewas(Math.abs(value))}</span></div> }

export function WishlistPage() {
  const client = useQueryClient()
  const wishlist = useQuery({ queryKey: ["customer", "wishlist"], queryFn: () => storefrontRequest<Array<{ product: ProductListItem }>>(api.get("/customer/wishlist"), "Wishlist could not be loaded") })
  return <main className="page-shell py-10 pb-24 md:py-14"><PageHeader eyebrow="Customer account" title="Wishlist" detail="The pieces you have saved for later."/>{wishlist.isLoading ? <Loading/> : wishlist.data?.length ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">{wishlist.data.map(({ product }) => <div key={product.id}><ProductCard product={product}/><Button variant="ghost" size="sm" className="mt-2 w-full text-error" onClick={async () => { await api.delete(`/customer/wishlist/${product.id}`); client.invalidateQueries({ queryKey: ["customer", "wishlist"] }) }}><Trash2/> Remove</Button></div>)}</div> : <Empty title="No saved pieces" href="/shop" action="Discover products"/>}</main>
}

export function AddressesPage() {
  const client = useQueryClient()
  const addresses = useQuery({ queryKey: ["customer", "addresses"], queryFn: () => storefrontRequest<CustomerAddressData[]>(api.get("/customer/addresses"), "Addresses could not be loaded") })
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ recipientName: "", phone: "", region: "Greater Accra", cityTown: "", streetAddress: "", label: "Home" })
  const save = useMutation({ mutationFn: () => api.post("/customer/addresses", { ...form, isDefault: !(addresses.data?.length) }), onSuccess: () => { setShow(false); client.invalidateQueries({ queryKey: ["customer", "addresses"] }); toast.success("Address saved") } })
  return <main className="page-shell py-10 pb-24 md:py-14"><div className="flex justify-between gap-4"><PageHeader eyebrow="Customer account" title="Address Book" detail="Manage the Ghana delivery addresses available at checkout."/><Button className="h-fit" onClick={() => setShow((value) => !value)}>Add address</Button></div>{show && <form className="mb-8 grid gap-4 border border-outline-variant bg-white p-6 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>{Object.entries(form).map(([key, value]) => <label key={key} className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}<Input required className="mt-2" value={value} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}/></label>)}<Button type="submit" className="sm:col-span-2">Save address</Button></form>}{addresses.isLoading ? <Loading/> : addresses.data?.length ? <div className="grid gap-4 lg:grid-cols-2">{addresses.data.map((address) => <article key={address.id} className="border border-outline-variant bg-white p-6"><div className="flex justify-between"><h2 className="font-heading text-xl font-semibold">{address.label || "Delivery address"}</h2>{address.isDefault && <span className="bg-surface-container px-3 py-1 text-xs">Default</span>}</div><p className="mt-4 text-sm leading-6">{address.recipientName}<br/>{address.streetAddress}<br/>{[address.areaSuburb, address.cityTown, address.region].filter(Boolean).join(", ")}<br/>{address.phone}</p><Button variant="ghost" size="sm" className="mt-4 text-error" onClick={async () => { await api.delete(`/customer/addresses/${address.id}`); client.invalidateQueries({ queryKey: ["customer", "addresses"] }) }}>Remove</Button></article>)}</div> : <Empty title="No saved addresses" href="/checkout/delivery" action="Add one at checkout"/>}</main>
}

export function AccountSettingsPage() {
  const client = useQueryClient()
  const profile = useQuery({ queryKey: ["customer", "profile"], queryFn: () => storefrontRequest<CustomerProfileData>(api.get("/customer/profile"), "Profile could not be loaded") })
  const [form, setForm] = useState<{ firstName: string; lastName: string } | null>(null)
  const [changingPhone, setChangingPhone] = useState(false)
  const values = form || { firstName: profile.data?.firstName || "", lastName: profile.data?.lastName || "" }

  async function refreshProfile() {
    setChangingPhone(false)
    await client.invalidateQueries({ queryKey: ["customer", "profile"] })
  }

  async function startPhoneChange() {
    if (profile.data?.phoneNumber && !profile.data.phoneNumberVerified) {
      const result = await authClient.updateUser({ phoneNumber: null })
      if (result.error) {
        toast.error(result.error.message)
        return
      }
    }
    setChangingPhone(true)
  }

  async function removePhone() {
    const result = await authClient.updateUser({ phoneNumber: null })
    if (result.error) {
      toast.error(result.error.message)
      return
    }
    toast.success("Phone number removed")
    await refreshProfile()
  }

  return (
    <main className="page-shell py-10 pb-24 md:py-14">
      <PageHeader eyebrow="Customer account" title="Account Settings" detail="Keep your contact details accurate for future orders."/>
      {profile.isLoading ? <Loading/> : (
        <div className="max-w-2xl space-y-6">
          <form className="space-y-5 border border-outline-variant bg-white p-6" onSubmit={async (event) => { event.preventDefault(); await api.patch("/customer/profile", values); await client.invalidateQueries({ queryKey: ["customer", "profile"] }); toast.success("Account updated") }}>
            <label className="block text-sm font-medium">First name<Input className="mt-2" value={values.firstName} onChange={(event) => setForm({ ...values, firstName: event.target.value })}/></label>
            <label className="block text-sm font-medium">Last name<Input className="mt-2" value={values.lastName} onChange={(event) => setForm({ ...values, lastName: event.target.value })}/></label>
            <label className="block text-sm font-medium">Email<Input className="mt-2" disabled value={profile.data?.email || ""}/></label>
            <Button type="submit">Save profile</Button>
          </form>
          <section className="border border-outline-variant bg-white p-6">
            <h2 className="type-headline-md">Verified phone</h2>
            <p className="mt-2 text-sm text-muted-foreground">A verified phone can be used for sign-in, password recovery, and security messages.</p>
            {profile.data?.phoneNumber && !changingPhone ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 bg-surface-container p-4">
                <div>
                  <p className="font-semibold">{profile.data.phoneNumber}</p>
                  <p className="text-xs text-muted-foreground">{profile.data.phoneNumberVerified ? "Verified" : "Not yet verified"}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={startPhoneChange}>{profile.data.phoneNumberVerified ? "Change" : "Verify"}</Button>
                  <Button type="button" variant="ghost" onClick={removePhone}>Remove</Button>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <PhoneVerificationPanel
                  initialPhone={!profile.data?.phoneNumberVerified ? profile.data?.phoneNumber || "" : ""}
                  onVerified={refreshProfile}
                  onSkip={changingPhone ? refreshProfile : undefined}
                />
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

function Empty({ title, href, action }: { title: string; href: string; action: string }) { return <div className="border border-dashed border-outline-variant p-10 text-center"><h2 className="type-headline-md">{title}</h2><Button className="mt-5" variant="outline" render={<Link href={href}/>}>{action}</Button></div> }
