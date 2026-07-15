import { ProductEditor } from "@/components/admin/products-admin"
export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  return <ProductEditor productId={(await params).productId} />
}
