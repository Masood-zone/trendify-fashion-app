import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const prismaTransactionOptions = {
  maxWait: positiveInteger(process.env.PRISMA_TRANSACTION_MAX_WAIT_MS, 10_000),
  timeout: positiveInteger(process.env.PRISMA_TRANSACTION_TIMEOUT_MS, 30_000),
}

export const prismaPoolOptions = {
  connectionString: process.env.DATABASE_URL!,
  max: positiveInteger(process.env.PRISMA_POOL_MAX, 5),
  connectionTimeoutMillis: positiveInteger(
    process.env.PRISMA_POOL_CONNECTION_TIMEOUT_MS,
    10_000
  ),
  idleTimeoutMillis: positiveInteger(
    process.env.PRISMA_POOL_IDLE_TIMEOUT_MS,
    30_000
  ),
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(prismaPoolOptions),
    transactionOptions: prismaTransactionOptions,
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
