import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { UserRole } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

/**
 * Rolą zarządza Clerk (publicMetadata.role) — tam jest źródło prawdy.
 * Kopia w tabeli `users` służy tylko do filtrowania i joinów w SQL.
 */
export function roleFromClerk(user: {
  publicMetadata?: Record<string, unknown>
}): UserRole {
  const raw = user.publicMetadata?.role
  if (typeof raw !== "string") return UserRole.STUDENT
  const upper = raw.toUpperCase()
  return upper in UserRole ? (upper as UserRole) : UserRole.STUDENT
}

export function isAdmin(role: UserRole | undefined) {
  return role === UserRole.ADMIN
}

export function isTeacher(role: UserRole | undefined) {
  return role === UserRole.TEACHER
}

/** Do dashboardu wchodzą tylko admin i nauczyciel. */
export function canAccessDashboard(role: UserRole | undefined) {
  return role === UserRole.ADMIN || role === UserRole.TEACHER
}

export type DashboardContext = {
  clerkId: string
  role: UserRole
  userId: string
  email: string
  fullName: string
  imageUrl: string | null
  /** Ustawione tylko dla roli TEACHER z założonym profilem. */
  teacherProfileId: string | null
  isAdmin: boolean
}

async function loadContext(): Promise<DashboardContext | null> {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const role = roleFromClerk(clerkUser)
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      teacherProfile: { select: { id: true } },
    },
  })
  if (!dbUser) return null

  const fullName =
    [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") ||
    dbUser.email

  return {
    clerkId: clerkUser.id,
    role,
    userId: dbUser.id,
    email: dbUser.email,
    fullName,
    imageUrl: dbUser.imageUrl,
    teacherProfileId: dbUser.teacherProfile?.id ?? null,
    isAdmin: role === UserRole.ADMIN,
  }
}

/**
 * Dla layoutów i stron RSC — przekierowuje zamiast rzucać.
 * To jest autorytatywna bramka; proxy.ts robi tylko optymistyczny redirect.
 */
export async function ensureDashboardPage(): Promise<DashboardContext> {
  const ctx = await loadContext()
  if (!ctx) redirect("/sign-in")
  if (!canAccessDashboard(ctx.role)) redirect("/")
  return ctx
}

/** Dla stron RSC dostępnych wyłącznie dla admina. */
export async function ensureAdminPage(): Promise<DashboardContext> {
  const ctx = await ensureDashboardPage()
  if (!ctx.isAdmin) redirect("/dashboard")
  return ctx
}

/** Dla server actions — rzuca, bo tu nie ma sensownego redirectu. */
export async function requireDashboardUser(): Promise<DashboardContext> {
  const ctx = await loadContext()
  if (!ctx) throw new Error("Brak dostępu: użytkownik niezalogowany.")
  if (!canAccessDashboard(ctx.role)) {
    throw new Error("Brak uprawnień do panelu.")
  }
  return ctx
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
