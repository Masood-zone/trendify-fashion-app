import { prisma } from "@/lib/prisma"
import { sendSms } from "@/services/notifications/providers"
import { renderAuthOtpMessage } from "@/services/notifications/templates"

export async function sendAuthOtpSms(phoneNumber: string, code: string) {
  const message = await renderAuthOtpMessage({
    otp: code,
    type: "phone-verification",
  })
  return sendSms({ to: phoneNumber, message: message.sms })
}

export async function sendAuthPasswordResetSms(phoneNumber: string, code: string) {
  const account = await prisma.user.findUnique({
    where: { phoneNumber },
    select: { phoneNumberVerified: true },
  })
  if (!account?.phoneNumberVerified) return
  const message = await renderAuthOtpMessage({
    otp: code,
    type: "phone-password-reset",
  })
  return sendSms({ to: phoneNumber, message: message.sms })
}
