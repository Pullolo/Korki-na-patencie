import type { LocationType } from "@/lib/generated/prisma/enums"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"

/**
 * Tryb zajęć w adresie strony. Enum Prismy jest po angielsku i wielkimi
 * literami, a adresy w tym serwisie są polskie — `?tryb=u-nauczyciela`.
 */
export const MODE_SLUGS: Record<string, LocationType> = {
  online: "ONLINE",
  "u-nauczyciela": "TEACHER_PLACE",
  "u-ucznia": "STUDENT_PLACE",
}

export const MODE_TO_SLUG: Record<LocationType, string> = {
  ONLINE: "online",
  TEACHER_PLACE: "u-nauczyciela",
  STUDENT_PLACE: "u-ucznia",
}

export function modeFromSlug(slug: string | undefined | null) {
  if (!slug) return null
  return MODE_SLUGS[slug] ?? null
}

export const MODE_OPTIONS = Object.entries(MODE_TO_SLUG).map(
  ([mode, slug]) => ({
    value: slug,
    label: LOCATION_TYPE_LABELS[mode as LocationType],
  })
)

/** Pierwsza wartość parametru — Next podaje tablicę, gdy powtórzy się w adresie. */
export function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}
