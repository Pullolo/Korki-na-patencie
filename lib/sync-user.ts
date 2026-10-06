import { cache } from "react"

import { getClerkUser } from "@/lib/clerk-user"
import { roleFromClerk } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

/**
 * Dopisuje zalogowanego użytkownika Clerka do naszej bazy i zwraca id wiersza.
 * Idzie po ścieżce szybkiej (jeden findUnique) i sięga po zapis dopiero przy
 * pierwszym wejściu albo po zmianie roli.
 *
 * `cache()` trzyma jedno wywołanie na żądanie: root layout i bramki z
 * `lib/auth.ts` czekają na ten sam zapis, zamiast ścigać się o ten sam wiersz.
 */
export const ensureUserSynced = cache(async (): Promise<string | null> => {
  const clerkUser = await getClerkUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses?.[0]?.emailAddress
  if (!email) return null

  const role = roleFromClerk(clerkUser)

  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true, role: true, email: true },
  })

  if (existing && existing.role === role && existing.email === email) {
    return existing.id
  }

  const profile = {
    email,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
    role,
  }

  try {
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: profile })
      return existing.id
    }

    // Uczeń wpisany wcześniej ręcznie w panelu ma już wiersz z tym mailem, ale
    // bez `clerkId`. Dopinamy konto do niego, zamiast zakładać drugi rekord —
    // inaczej rejestracja odcięłaby ucznia od jego historii lekcji.
    const byEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, clerkId: true },
    })

    if (byEmail && !byEmail.clerkId) {
      await prisma.user.update({
        where: { id: byEmail.id },
        data: { ...profile, clerkId: clerkUser.id },
      })
      return byEmail.id
    }

    const created = await prisma.user.create({
      data: { ...profile, clerkId: clerkUser.id },
      select: { id: true },
    })
    return created.id
  } catch (error) {
    // Konto skasowane w Clerku przy żywej sesji albo mail zajęty przez inne
    // konto — nie wywracamy z tego powodu całej strony.
    console.error("Nie udało się zsynchronizować użytkownika:", error)
    return existing?.id ?? null
  }
})
