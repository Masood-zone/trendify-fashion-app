import { Suspense } from "react"

import { VerifyPhoneForm } from "@/components/customer/customer-auth"

export default function Page() {
  return (
    <Suspense>
      <VerifyPhoneForm />
    </Suspense>
  )
}
