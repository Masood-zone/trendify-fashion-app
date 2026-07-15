import { AdminAuthCard } from "@/components/admin/admin-auth-card"
import { AdminPasswordRecovery } from "@/components/admin/admin-password-recovery"

export default function AdminForgotPasswordPage() {
  return (
    <AdminAuthCard title="Recover Administrator Access">
      <AdminPasswordRecovery />
    </AdminAuthCard>
  )
}
