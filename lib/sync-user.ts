import { currentUser } from "@clerk/nextjs/server"

import { roleFromClerk } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Dopisuje zalogowanego użytkownika Clerka do naszej bazy.
 * Wołane z root layoutu, więc idzie po ścieżce szybkiej (jeden findUnique)
 * i sięga po upsert tylko przy pierwszym wejściu albo po zmianie roli.
 */
export async function ensureUserSynced() {
  const clerkUser = await currentUser()
  if (!clerkUser) return

  const email = clerkUser.emailAddresses?.[0]?.emailAddress
  if (!email) return

  const role = roleFromClerk(clerkUser)

  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true, role: true, email: true },
  })

  if (existing && existing.role === role && existing.email === email) return

  try {
    await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        role,
      },
      create: {
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        role,
      },
    })
  } catch (error) {
    // Konto skasowane w Clerku przy żywej sesji albo kolizja e-maila
    // z rekordem-gościem — nie wywracamy z tego powodu całej strony.
    console.error("Nie udało się zsynchronizować użytkownika:", error)
  }
}
