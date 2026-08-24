import { formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const timeFormatter = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
})

const longDateFormatter = new Intl.DateTimeFormat("pl-PL", {
  weekday: "long",
  day: "numeric",
  month: "long",
})

export function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(new Date(value))
}

export function formatTime(value: Date | string) {
  return timeFormatter.format(new Date(value))
}

export function formatLongDate(value: Date | string) {
  return longDateFormatter.format(new Date(value))
}

export function formatRelativeTime(value: Date | string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: pl })
}

export function formatPrice(
  value: number | null | undefined,
  currency = "PLN"
) {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pl-PL").format(value)
}

/** 960 → "16:00". Godziny dostępności trzymamy jako minuty od północy. */
export function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** "16:00" → 960. */
export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + (m || 0)
}

/** Indeks 1–7 zgodnie z ISO (1 = poniedziałek). */
export const WEEKDAYS = [
  { value: 1, short: "pon", label: "poniedziałek" },
  { value: 2, short: "wt", label: "wtorek" },
  { value: 3, short: "śr", label: "środa" },
  { value: 4, short: "czw", label: "czwartek" },
  { value: 5, short: "pt", label: "piątek" },
  { value: 6, short: "sob", label: "sobota" },
  { value: 7, short: "niedz", label: "niedziela" },
] as const

/** Odmiana rzeczownika po liczbie: 1 lekcja, 2 lekcje, 5 lekcji. */
export function plural(count: number, one: string, few: string, many: string) {
  if (count === 1) return one
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

type BookingPerson = {
  guestName?: string | null
  student?: {
    firstName: string | null
    lastName: string | null
    email: string
  } | null
}

/** Uczeń może być zalogowany albo wpisany jako gość — nazwa bierze się z tego, co jest. */
export function studentLabel(booking: BookingPerson) {
  if (booking.student) {
    const name = [booking.student.firstName, booking.student.lastName]
      .filter(Boolean)
      .join(" ")
    return name || booking.student.email
  }
  return booking.guestName || "Gość"
}

export function teacherLabel(teacher: {
  user: { firstName: string | null; lastName: string | null }
}) {
  return (
    [teacher.user.firstName, teacher.user.lastName].filter(Boolean).join(" ") ||
    "Nauczyciel"
  )
}
