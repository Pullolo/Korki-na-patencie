import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getClerkUser } from "@/lib/clerk-user"
import { UserRole } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import {
  canAccessDashboard,
  isAdmin,
  isTeacher,
  roleFromClerk,
} from "@/lib/roles"
import { ensureUserSynced } from "@/lib/sync-user"

// Reguły ról żyją w `lib/roles.ts`, bo czyta je też nagłówek frontu w
// przeglądarce. Tutaj zostają w eksportach, żeby panel miał je w jednym
// miejscu razem z bramkami.
export { canAccessDashboard, isAdmin, isTeacher, roleFromClerk }

/**
 * Konto w Clerku jest, a wiersza w `users` nie ma i nie dało się go dopisać
 * (np. mail zajęty przez inne konto). To nie jest „niezalogowany" — odesłanie
 * na /sign-in z żywą sesją robi tylko pętlę, więc mówimy wprost, co się stało.
 */
const UNSYNCED_MESSAGE =
  "Twoje konto nie ma odpowiednika w naszej bazie. Odśwież stronę, a jeśli to nie pomoże — zgłoś się do administratora."

type Gate<T> =
  | { ok: true; ctx: T }
  | { ok: false; reason: "anon" | "unsynced" }

/**
 * Adres logowania z powrotem na stronę, na którą ktoś wchodził. Clerk czyta
 * `redirect_url` z adresu, a pełny URL żądania dokłada do nagłówków
 * `clerkMiddleware()` (`x-clerk-clerk-url`).
 */
async function signInPath() {
  const current = (await headers()).get("x-clerk-clerk-url")
  if (!current) return "/sign-in"

  try {
    const url = new URL(current)
    // `_rsc` to znacznik żądania RSC, nie część trasy.
    url.searchParams.delete("_rsc")
    const target = `${url.pathname}${url.search}`
    if (target.startsWith("/sign-in") || target.startsWith("/sign-up")) {
      return "/sign-in"
    }
    return `/sign-in?redirect_url=${encodeURIComponent(target)}`
  } catch {
    return "/sign-in"
  }
}

export type DashboardContext = {
  clerkId: string
  role: UserRole
  userId: string
  email: string
  fullName: string
  imageUrl: string | null
  /** Profil nauczyciela, jeśli konto go ma — także dla admina, który uczy. */
  teacherProfileId: string | null
  isAdmin: boolean
}

function findDashboardUser(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      teacherProfile: { select: { id: true } },
    },
  })
}

async function loadContext(): Promise<Gate<DashboardContext>> {
  const clerkUser = await getClerkUser()
  if (!clerkUser) return { ok: false, reason: "anon" }

  const role = roleFromClerk(clerkUser)
  let dbUser = await findDashboardUser(clerkUser.id)

  if (!dbUser) {
    // Root layout synchronizuje konto **równolegle** z tą bramką, więc przy
    // pierwszym wejściu po rejestracji wiersza może jeszcze nie być. Dołączamy
    // do tego samego wywołania (`cache()` w `sync-user.ts`) i pytamy ponownie —
    // bez tego świeżo zalogowana osoba leciała na /sign-in z ważną sesją.
    await ensureUserSynced().catch(() => null)
    dbUser = await findDashboardUser(clerkUser.id)
  }
  if (!dbUser) return { ok: false, reason: "unsynced" }

  // Osoba w panelu zawsze ma konto w Clerku, więc mail jest — pusty string
  // to tylko domknięcie typu po tym, jak `email` stał się opcjonalny.
  const email = dbUser.email ?? ""
  const fullName =
    [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") || email

  return {
    ok: true,
    ctx: {
      clerkId: clerkUser.id,
      role,
      userId: dbUser.id,
      email,
      fullName,
      imageUrl: dbUser.imageUrl,
      teacherProfileId: dbUser.teacherProfile?.id ?? null,
      isAdmin: role === UserRole.ADMIN,
    },
  }
}

/**
 * Dla layoutów i stron RSC — przekierowuje zamiast rzucać.
 * To jest autorytatywna bramka; proxy.ts robi tylko optymistyczny redirect.
 */
export async function ensureDashboardPage(): Promise<DashboardContext> {
  const gate = await loadContext()
  if (!gate.ok) {
    if (gate.reason === "unsynced") throw new Error(UNSYNCED_MESSAGE)
    redirect(await signInPath())
  }
  if (!canAccessDashboard(gate.ctx.role)) redirect("/")
  return gate.ctx
}

/** Dla stron RSC dostępnych wyłącznie dla admina. */
export async function ensureAdminPage(): Promise<DashboardContext> {
  const ctx = await ensureDashboardPage()
  if (!ctx.isAdmin) redirect("/dashboard")
  return ctx
}

/** Dla server actions — rzuca, bo tu nie ma sensownego redirectu. */
export async function requireDashboardUser(): Promise<DashboardContext> {
  const gate = await loadContext()
  if (!gate.ok) {
    throw new Error(
      gate.reason === "unsynced"
        ? UNSYNCED_MESSAGE
        : "Brak dostępu: użytkownik niezalogowany."
    )
  }
  if (!canAccessDashboard(gate.ctx.role)) {
    throw new Error("Brak uprawnień do panelu.")
  }
  return gate.ctx
}

export async function requireAdmin(): Promise<DashboardContext> {
  const ctx = await requireDashboardUser()
  if (!ctx.isAdmin)
    throw new Error("Ta operacja wymaga uprawnień administratora.")
  return ctx
}

/**
 * Admin widzi cudze dane, nauczyciel wyłącznie swoje.
 * Zwraca profil nauczyciela, na którym wolno operować — albo rzuca.
 */
export async function requireTeacherAccess(
  teacherProfileId: string
): Promise<DashboardContext> {
  const ctx = await requireDashboardUser()
  if (ctx.isAdmin) return ctx
  if (ctx.teacherProfileId !== teacherProfileId) {
    throw new Error("Brak uprawnień do danych tego nauczyciela.")
  }
  return ctx
}

/**
 * Filtr do zapytań o rezerwacje, uczniów i zapytania:
 * admin — bez ograniczeń, nauczyciel — tylko własny profil.
 * Nauczyciel bez profilu dostaje filtr, który nie zwróci nic.
 */
export function teacherScope(ctx: DashboardContext) {
  if (ctx.isAdmin) return {}
  return { teacherProfileId: ctx.teacherProfileId ?? "__brak__" }
}

/**
 * Konto ucznia jest osobną bramką niż panel: wpuszcza **każdego**
 * zalogowanego, także nauczyciela i admina, bo każdy z nich może mieć
 * u nas własne lekcje. Rola nie ma tu nic do rzeczy — liczy się tożsamość.
 */
export type AccountContext = {
  clerkId: string
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  fullName: string
  phone: string | null
  imageUrl: string | null
}

function findAccountUser(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      imageUrl: true,
    },
  })
}

async function loadAccount(): Promise<Gate<AccountContext>> {
  const clerkUser = await getClerkUser()
  if (!clerkUser) return { ok: false, reason: "anon" }

  let dbUser = await findAccountUser(clerkUser.id)
  if (!dbUser) {
    // To samo wyścigowe okno co w `loadContext()`.
    await ensureUserSynced().catch(() => null)
    dbUser = await findAccountUser(clerkUser.id)
  }
  if (!dbUser) return { ok: false, reason: "unsynced" }

  const email = dbUser.email ?? ""
  return {
    ok: true,
    ctx: {
      clerkId: clerkUser.id,
      userId: dbUser.id,
      email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      fullName:
        [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") || email,
      phone: dbUser.phone,
      imageUrl: dbUser.imageUrl,
    },
  }
}

/** Dla stron `/konto/**` — przekierowuje na logowanie zamiast rzucać. */
export async function ensureAccountPage(): Promise<AccountContext> {
  const gate = await loadAccount()
  if (!gate.ok) {
    if (gate.reason === "unsynced") throw new Error(UNSYNCED_MESSAGE)
    redirect(await signInPath())
  }
  return gate.ctx
}

/** Dla akcji ucznia — rzuca, bo w akcji nie ma sensownego przekierowania. */
export async function requireAccountUser(): Promise<AccountContext> {
  const gate = await loadAccount()
  if (!gate.ok) {
    throw new Error(
      gate.reason === "unsynced"
        ? UNSYNCED_MESSAGE
        : "Zaloguj się, żeby wykonać tę operację."
    )
  }
  return gate.ctx
}
