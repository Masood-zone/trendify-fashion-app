import { PaymentDetail } from "@/components/admin/payments-admin"
export default async function Page({
  params,
}: {
  params: Promise<{ paymentId: string }>
}) {
  return <PaymentDetail paymentId={(await params).paymentId} />
}
