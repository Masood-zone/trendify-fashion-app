import { sendEmail } from "@/services/notifications/providers"
import {
  renderAuthOtpMessage,
  type AuthOtpType,
} from "@/services/notifications/templates"

export async function sendAuthOtpEmail(input: {
  email: string
  otp: string
  type: AuthOtpType
}) {
  const message = await renderAuthOtpMessage(input)
  return sendEmail({
    to: input.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  })
}
