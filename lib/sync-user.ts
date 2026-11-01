import { cache } from "react"

import { getClerkUser, roleFromClerk } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Dopisuje zalogowanego użytkownika Clerka do naszej bazy.
 * Wołane z root layoutu, więc idzie po ścieżce szybkiej (jeden findUnique)
 * i sięga po zapis dopiero przy pierwszym wejściu albo po zmianie roli.
 *
 * Memoizowane na żądanie: root layout renderuje się raz, ale przy nawigacji
 * klientem Next potrafi wywołać layout ponownie w tym samym przebiegu.
 */
export const ensureUserSynced = cache(async () => {
  const clerkUser = await getClerkUser()
  if (!clerkUser) return

  const email = clerkUser.emailAddresses?.[0]?.emailAddress
  if (!email) return

  const role = roleFromClerk(clerkUser)

  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true, role: true, email: true },
  })

  if (existing && existing.role === role && existing.email === email) return

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
      return
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
      return
    }

    await prisma.user.create({ data: { ...profile, clerkId: clerkUser.id } })
  } catch (error) {
    // Konto skasowane w Clerku przy żywej sesji albo mail zajęty przez inne
    // konto — nie wywracamy z tego powodu całej strony.
    console.error("Nie udało się zsynchronizować użytkownika:", error)
  }
})
