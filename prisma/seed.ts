import "dotenv/config"

import { randomUUID } from "node:crypto"
import { hashPassword } from "better-auth/crypto"

import { prisma } from "../lib/prisma"

async function main() {
  const name = process.env.ADMIN_NAME?.trim()
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required to seed an administrator"
    )
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must contain at least 8 characters")
  }

  const administrator = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } })
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: { name, role: "ADMIN", banned: false, deletedAt: null },
          })
        : await tx.user.create({
            data: {
              name,
              email,
              role: "ADMIN",
              emailVerified: true,
            },
          })

      const credential = await tx.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      })
      if (!credential) {
        await tx.account.create({
          data: {
            id: randomUUID(),
            accountId: user.id,
            providerId: "credential",
            userId: user.id,
            password: await hashPassword(password),
          },
        })
      }
      return user
    },
    { maxWait: 20_000, timeout: 60_000 }
  )

  console.log(`Administrator ready: ${administrator.email}`)
  console.log("Existing credential passwords are preserved on repeated runs.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
