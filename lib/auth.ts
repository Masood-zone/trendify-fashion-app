import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin, emailOTP, phoneNumber } from "better-auth/plugins"
import { after } from "next/server"

import { prisma } from "@/lib/prisma"
import { enqueuePasswordResetSuccess } from "@/services/notifications/events"
import { sendAuthOtpEmail } from "@/services/notifications/email"
import {
  sendAuthOtpSms,
  sendAuthPasswordResetSms,
} from "@/services/notifications/sms"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    async onPasswordReset({ user }) {
      const account = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          phoneNumberVerified: true,
        },
      })
      if (account) {
        try {
          await enqueuePasswordResetSuccess(account)
        } catch (error) {
          console.error("Password reset confirmation could not be queued", error)
        }
      }
    },
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
      expiresIn: 300,
      allowedAttempts: 3,
      requireVerification: true,
      phoneNumberValidator(phone) {
        return /^\+233\d{9}$/.test(phone)
      },
      async sendOTP({ phoneNumber, code }) {
        await sendAuthOtpSms(phoneNumber, code)
      },
      async sendPasswordResetOTP({ phoneNumber, code }) {
        await sendAuthPasswordResetSms(phoneNumber, code)
      },
    }),
  ],
  advanced: {
    backgroundTasks: { handler: after },
  },
})
