import { ProductPreview } from "@/components/admin/products-admin"

export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  return <ProductPreview productId={(await params).productId} />
}
