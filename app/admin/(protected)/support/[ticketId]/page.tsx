import { SupportDetail } from "@/components/admin/support-admin"
export default async function Page({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  return <SupportDetail ticketId={(await params).ticketId} />
}
