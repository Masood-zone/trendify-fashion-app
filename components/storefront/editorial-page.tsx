"use client"

import Image from "next/image"
import { useQuery } from "@tanstack/react-query"

import api from "@/lib/axios"
import { storefrontRequest } from "@/services/storefront/storefront"

type Content = { title: string; excerpt: string | null; body: string; mediaAsset: { secureUrl: string; altText: string | null } | null }

export function EditorialPage({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  const content = useQuery({ queryKey: ["storefront", "content", slug], queryFn: () => storefrontRequest<Content>(api.get(`/storefront/content/${slug}`), "Content could not be loaded"), retry: false })
  return <main>{content.data?.mediaAsset && <section className="relative min-h-[28rem]"><Image src={content.data.mediaAsset.secureUrl} alt={content.data.mediaAsset.altText || content.data.title} fill className="object-cover"/><div className="absolute inset-0 bg-black/35"/><div className="page-shell relative flex min-h-[28rem] items-end py-12 text-white"><h1 className="type-display">{content.data.title}</h1></div></section>}<article className="page-shell max-w-4xl py-16 sm:py-24">{!content.data?.mediaAsset && <h1 className="type-display">{content.data?.title || fallbackTitle}</h1>}{content.data?.excerpt && <p className="type-body-lg mt-5 text-muted-foreground">{content.data.excerpt}</p>}{content.isLoading ? <div className="mt-8 h-64 animate-pulse bg-surface-container"/> : content.data ? <div className="prose prose-lg mt-10 max-w-none" dangerouslySetInnerHTML={{ __html: content.data.body }}/> : <p className="mt-8 border border-dashed border-surface-dim p-8 text-muted-foreground">This page is being prepared by the Trendify team.</p>}</article></main>
}
