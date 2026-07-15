"use client"

import Image from "next/image"
import Link from "next/link"

import { useCollections } from "@/services/storefront/storefront"

export function CollectionsPage() {
  const collections = useCollections()
  return <main><section className="page-shell py-16 text-center"><p className="type-label text-on-tertiary-container">Shop by story</p><h1 className="type-display mt-3">Our Collections</h1><p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Curated Ghanaian narratives, translated into contemporary pieces.</p></section><section className="page-shell grid gap-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">{collections.isLoading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/5] animate-pulse bg-surface-container"/>) : collections.data?.map((collection, index) => <Link key={collection.id} href={`/collections/${collection.slug}`} className={`${index === 0 ? "sm:col-span-2" : ""} group relative min-h-[28rem] overflow-hidden border border-surface-dim bg-surface-container`}>{collection.imageUrl && <Image src={collection.imageUrl} alt={collection.name} fill sizes="50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"/>}<div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-7 text-white"><h2 className="type-headline-lg">{collection.name}</h2><p className="mt-2 max-w-xl text-sm text-white/80">{collection.description}</p><span className="mt-4 inline-block border-b border-white text-xs font-bold uppercase">Explore collection</span></div></Link>)}</section></main>
}
