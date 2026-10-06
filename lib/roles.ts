import { UserRole } from "@/lib/generated/prisma/enums"

/**
 * Czyste reguły ról — bez `next/headers` i bez SDK serwerowego Clerka, żeby
 * nagłówek frontu mógł policzyć to samo w przeglądarce.
 *
 * Rolą zarządza Clerk (publicMetadata.role) — tam jest źródło prawdy.
 * Kopia w tabeli `users` służy tylko do filtrowania i joinów w SQL.
 */
export function roleFromClerk(user: {
  publicMetadata?: Record<string, unknown> | null
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
