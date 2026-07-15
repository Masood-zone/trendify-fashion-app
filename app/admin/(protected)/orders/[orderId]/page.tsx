import { OrderDetail } from "@/components/admin/orders-admin"
export default async function Page({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  return <OrderDetail orderId={(await params).orderId} />
}
