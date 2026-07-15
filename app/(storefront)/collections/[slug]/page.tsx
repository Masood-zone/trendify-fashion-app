import { Suspense } from "react"

import { CataloguePage } from "@/components/storefront/catalogue-page"

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <Suspense>
      <CataloguePage title="Collection" initialCollection={slug} />
    </Suspense>
  )
}
