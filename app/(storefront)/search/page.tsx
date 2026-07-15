import { Suspense } from "react"

import { CataloguePage } from "@/components/storefront/catalogue-page"

export default function Page() {
  return (
    <Suspense>
      <CataloguePage searchMode />
    </Suspense>
  )
}
