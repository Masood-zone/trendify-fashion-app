import { GuestOrderPage } from "@/components/storefront/guest-order-page"

export default async function Page({ params }: { params: Promise<{ orderNumber: string }> }) { const { orderNumber } = await params; return <GuestOrderPage orderNumber={orderNumber}/> }
