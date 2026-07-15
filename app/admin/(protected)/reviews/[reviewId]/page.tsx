import { ReviewDetail } from "@/components/admin/reviews-admin"
export default async function Page({
  params,
}: {
  params: Promise<{ reviewId: string }>
}) {
  return <ReviewDetail reviewId={(await params).reviewId} />
}
