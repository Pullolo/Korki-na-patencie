import type { NotificationType, UserRole } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

/**
 * Powiadomienie trafia albo do konkretnej osoby (`userId`), albo do wszystkich
 * z daną rolą (`targetRole`). Zapis nigdy nie może wywrócić akcji, która go
 * wywołała — jak coś pójdzie nie tak, gubimy powiadomienie, nie operację.
 */
export async function notify(input: {
  type: NotificationType
  title: string
  message?: string
  link?: string
  userId?: string
  targetRole?: UserRole
}) {
  if (!input.userId && !input.targetRole) return

  try {
    await prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message ?? null,
        link: input.link ?? null,
        userId: input.userId ?? null,
        targetRole: input.targetRole ?? null,
      },
    })
  } catch (error) {
    console.error("Nie udało się zapisać powiadomienia:", error)
  }
}
