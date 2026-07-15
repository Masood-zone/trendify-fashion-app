import type { Prisma } from "@/app/generated/prisma/client"
import { prisma } from "@/lib/prisma"

export async function auditAdmin(
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Prisma.InputJsonValue
) {
  await prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, metadata },
  })
}
