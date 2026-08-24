import type {
  BookingStatus,
  InquiryStatus,
  LocationType,
  PageStatus,
  ReviewStatus,
  UserRole,
} from "@/lib/generated/prisma/enums"

/** Wariant kolorystyczny badge'a — mapowany na klasy w components/dashboard/status-badge.tsx */
export type BadgeTone =
  "neutral" | "amber" | "green" | "red" | "blue" | "violet"

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  TEACHER: "Nauczyciel",
  STUDENT: "Uczeń",
}

export const USER_ROLE_TONES: Record<UserRole, BadgeTone> = {
  ADMIN: "violet",
  TEACHER: "blue",
  STUDENT: "neutral",
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Oczekuje",
  CONFIRMED: "Potwierdzona",
  REJECTED: "Odrzucona",
  CANCELLED: "Odwołana",
  COMPLETED: "Odbyta",
  NO_SHOW: "Nieobecność",
}

export const BOOKING_STATUS_TONES: Record<BookingStatus, BadgeTone> = {
  PENDING: "amber",
  CONFIRMED: "green",
  REJECTED: "red",
  CANCELLED: "neutral",
  COMPLETED: "blue",
  NO_SHOW: "red",
}

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  ONLINE: "Online",
  TEACHER_PLACE: "U nauczyciela",
  STUDENT_PLACE: "U ucznia",
}

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: "Nowe",
  IN_PROGRESS: "W trakcie",
  CLOSED: "Zamknięte",
}

export const INQUIRY_STATUS_TONES: Record<InquiryStatus, BadgeTone> = {
  NEW: "amber",
  IN_PROGRESS: "blue",
  CLOSED: "neutral",
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: "Do moderacji",
  APPROVED: "Opublikowana",
  REJECTED: "Odrzucona",
}

export const REVIEW_STATUS_TONES: Record<ReviewStatus, BadgeTone> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
}

export const PAGE_STATUS_LABELS: Record<PageStatus, string> = {
  DRAFT: "Szkic",
  PUBLISHED: "Opublikowana",
}
