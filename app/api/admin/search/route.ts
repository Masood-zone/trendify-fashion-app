import { requireAdmin } from "@/lib/admin-api"
import { ok, serverError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const guard = await requireAdmin(request)
  if ("response" in guard) return guard.response
  try {
    const q = new URL(request.url).searchParams.get("q")?.trim()
    if (!q || q.length < 2)
      return ok({ products: [], orders: [], customers: [] })
    const [products, orders, customers] = await prisma.$transaction([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            {
              variants: { some: { sku: { contains: q, mode: "insensitive" } } },
            },
          ],
        },
        select: { id: true, name: true, slug: true },
        take: 6,
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, orderNumber: true, customerName: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.user.findMany({
        where: {
          role: "CUSTOMER",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phoneNumber: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, email: true },
        take: 6,
      }),
    ])
    return ok({
      products: products.map((item) => ({
        id: item.id,
        label: item.name,
        description: item.slug,
      })),
      orders: orders.map((item) => ({
        id: item.id,
        label: item.orderNumber,
        description: item.customerName,
      })),
      customers: customers.map((item) => ({
        id: item.id,
        label: item.name,
        description: item.email,
      })),
    })
  } catch (error) {
    return serverError(error)
  }
}
