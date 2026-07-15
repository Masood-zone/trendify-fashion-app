"use client"

import { useState } from "react"
import { Mail, MapPin, Phone } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import { useHome } from "@/services/storefront/storefront"

export function SupportPage() {
  const home = useHome()
  const settings = home.data?.settings
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  return <main className="page-shell py-16 sm:py-24"><div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]"><section><p className="type-label text-on-tertiary-container">Customer care</p><h1 className="type-display mt-3">How can we help?</h1><p className="mt-5 leading-7 text-muted-foreground">Questions about products, delivery, payments, or an existing order are welcome.</p><div className="mt-10 space-y-5 text-sm">{settings?.supportEmail && <p className="flex gap-3"><Mail className="size-5"/>{settings.supportEmail}</p>}{settings?.supportPhone && <p className="flex gap-3"><Phone className="size-5"/>{settings.supportPhone}</p>}{settings?.address && <p className="flex gap-3"><MapPin className="size-5"/>{settings.address}</p>}</div></section><form className="ambient-shadow grid gap-5 border border-surface-dim bg-white p-6 sm:grid-cols-2 sm:p-10" onSubmit={async (event) => { event.preventDefault(); setSaving(true); try { const response = await api.post("/storefront/contact", form); const ticket = response.data?.data?.ticketNumber; toast.success(ticket ? `Support request ${ticket} created` : "Support request created"); setForm({ name: "", email: "", phone: "", subject: "", message: "" }) } catch { toast.error("Your message could not be sent") } finally { setSaving(false) } }}><label className="text-sm font-medium">Name<Input required className="mt-2" value={form.name} onChange={(event) => set("name", event.target.value)}/></label><label className="text-sm font-medium">Email<Input required type="email" className="mt-2" value={form.email} onChange={(event) => set("email", event.target.value)}/></label><label className="text-sm font-medium">Phone<Input className="mt-2" value={form.phone} onChange={(event) => set("phone", event.target.value)}/></label><label className="text-sm font-medium">Subject<Input required className="mt-2" value={form.subject} onChange={(event) => set("subject", event.target.value)}/></label><label className="text-sm font-medium sm:col-span-2">Message<textarea required minLength={10} className="mt-2 min-h-40 w-full border border-outline-variant p-3" value={form.message} onChange={(event) => set("message", event.target.value)}/></label><Button type="submit" size="lg" disabled={saving} className="sm:col-span-2 sm:w-fit">{saving ? "Sending…" : "Send message"}</Button></form></div></main>
}
