import { OrderDetailPage } from "@/components/customer/account-pages"
export default async function Page({ params }: { params: Promise<{ orderNumber: string }> }) { const { orderNumber } = await params; return <OrderDetailPage orderNumber={orderNumber}/> }
