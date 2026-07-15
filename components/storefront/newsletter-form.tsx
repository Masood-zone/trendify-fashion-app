"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  return <form className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row" onSubmit={async (event) => { event.preventDefault(); setSaving(true); try { await api.post("/storefront/newsletter", { email, source: "homepage" }); setEmail(""); toast.success("You are on the Trendify list") } catch { toast.error("Subscription could not be saved") } finally { setSaving(false) } }}><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" className="sm:h-13"/><Button type="submit" size="lg" disabled={saving}>{saving ? "Subscribing…" : "Subscribe"}</Button></form>
}
