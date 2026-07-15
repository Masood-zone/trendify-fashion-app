import nodemailer from "nodemailer"

type AuthOtpType =
  "sign-in" | "email-verification" | "forget-password" | "change-email"

function transport() {
  const port = Number(process.env.SMTP_PORT || 587)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
}

export async function sendAuthOtpEmail(input: {
  email: string
  otp: string
  type: AuthOtpType
}) {
  if (!process.env.SMTP_HOST) throw new Error("SMTP is not configured")
  await transport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: input.email,
    subject:
      input.type === "forget-password"
        ? "Reset your Trendify password"
        : "Your Trendify verification code",
    text: `Your Trendify verification code is ${input.otp}. It expires shortly.`,
  })
}
