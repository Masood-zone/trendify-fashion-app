import { DiscountEditor } from "@/components/admin/discounts-admin"
export default async function Page({
  params,
}: {
  params: Promise<{ promotionId: string }>
}) {
  return <DiscountEditor promotionId={(await params).promotionId} />
}
