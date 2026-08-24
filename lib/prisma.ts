import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/lib/generated/prisma/client"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

// W devie Next przeładowuje moduły przy każdej zmianie — bez cache'u w globalThis
// każdy hot reload otwierałby nową pulę połączeń.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
