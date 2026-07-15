import { CustomerDetail } from "@/components/admin/customers-admin"
export default async function Page({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  return <CustomerDetail customerId={(await params).customerId} />
}
