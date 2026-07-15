import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin, emailOTP, phoneNumber } from "better-auth/plugins"

import { prisma } from "@/lib/prisma"
import { sendAuthOtpEmail } from "@/services/notifications/email"
import { sendAuthOtpSms } from "@/services/notifications/sms"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: { autoSignInAfterVerification: true },
  user: {
    additionalFields: {
      firstName: { type: "string", required: false },
      lastName: { type: "string", required: false },
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
        input: false,
      },
    },
  },
  plugins: [
    admin({ defaultRole: "CUSTOMER", adminRoles: ["ADMIN"] }),
    emailOTP({
      otpLength: 6,
      storeOTP: "hashed",
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        await sendAuthOtpEmail({ email, otp, type })
      },
    }),
    phoneNumber({
      otpLength: 6,
      async sendOTP({ phoneNumber, code }) {
        await sendAuthOtpSms(phoneNumber, code)
      },
    }),
  ],
})
