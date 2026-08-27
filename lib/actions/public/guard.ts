import { createHmac, timingSafeEqual } from "node:crypto"

import { headers } from "next/headers"

import { prisma } from "@/lib/prisma"

/**
 * Wspólna bramka akcji publicznych.
 *
 * Formularze na stronie wypełnia nieznajomy, więc zanim cokolwiek zapiszemy,
 * sprawdzamy trzy rzeczy: czy to nie bot (pole-pułapka i czas wypełniania),
 * czy ten sam adres nie wysyła seryjnie zgłoszeń, i czy dane w ogóle mają sens
 * (to już robi zod w `lib/validation.ts`).
 *
 * Adresu IP nie zapisujemy w żadnej tabeli — służy wyłącznie do liczenia
 * limitu w pamięci procesu (`docs/FRONTEND.md`, sekcja 6, „Dane osobowe").
 */

const SECRET =
  process.env.FORM_SECRET ??
  process.env.CLERK_SECRET_KEY ??
  "korki-dev-secret"

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("base64url")
}

/**
 * Znacznik czasu renderu formularza, podpisany, żeby nie dało się go podmienić.
 * Bot wypełnia formularz w ułamku sekundy — człowiek potrzebuje kilku.
 */
export function formStamp() {
  const issued = String(Date.now())
  return `${issued}.${sign(issued)}`
}

const MIN_FILL_MS = 2_000
const MAX_FORM_AGE_MS = 6 * 60 * 60 * 1000

export function stampLooksHuman(stamp: string | undefined | null) {
  if (!stamp) return false
  const [issued, signature] = stamp.split(".")
  if (!issued || !signature) return false

  const expected = sign(issued)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false

  const age = Date.now() - Number(issued)
  if (!Number.isFinite(age)) return false
  return age >= MIN_FILL_MS && age <= MAX_FORM_AGE_MS
}

/** Pole ukryte przed człowiekiem. Wypełnione = bot. */
export function honeypotFilled(value: string | undefined | null) {
  return Boolean(value && value.trim())
}

export async function clientIp() {
  const store = await headers()
  const forwarded = store.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || null
  return store.get("x-real-ip")
}

/**
 * Licznik w pamięci procesu. Przy jednej instancji wystarcza, przy wielu jest
 * przybliżeniem — dlatego drugą, twardą granicą jest licznik w bazie niżej.
 */
const hits = new Map<string, number[]>()

export function tooManyFromAddress(
  ip: string | null,
  action: string,
  { limit = 10, windowMs = 3_600_000 } = {}
) {
  if (!ip) return false
  const key = `${action}:${ip}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
  recent.push(now)
  hits.set(key, recent)

  // Mapa nie może rosnąć w nieskończoność w długo żyjącym procesie.
  if (hits.size > 5_000) {
    for (const [entry, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) hits.delete(entry)
    }
  }

  return recent.length > limit
}

const HOUR_MS = 3_600_000

/** Ile zgłoszeń rezerwacji poszło z tego kontaktu w ostatniej godzinie. */
export async function recentBookingCount(email: string | null, phone: string | null) {
  if (!email && !phone) return 0
  return prisma.booking.count({
    where: {
      createdAt: { gte: new Date(Date.now() - HOUR_MS) },
      OR: [
        ...(email ? [{ guestEmail: email }] : []),
        ...(phone ? [{ guestPhone: phone }] : []),
      ],
    },
  })
}

export async function recentInquiryCount(email: string) {
  return prisma.inquiry.count({
    where: { email, createdAt: { gte: new Date(Date.now() - HOUR_MS) } },
  })
}

export async function recentEnrollmentCount(email: string | null, phone: string | null) {
  if (!email && !phone) return 0
  return prisma.groupEnrollment.count({
    where: {
      createdAt: { gte: new Date(Date.now() - HOUR_MS) },
      OR: [
        ...(email ? [{ guestEmail: email }] : []),
        ...(phone ? [{ guestPhone: phone }] : []),
      ],
    },
  })
}

/** Kod dyktowany przez telefon — bez znaków, które łatwo pomylić (0/O, 1/I). */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function randomCode(prefix: string, length = 4) {
  const code = Array.from(
    { length },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  ).join("")
  return `${prefix}-${code}`
}

export async function uniqueBookingReference() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const reference = randomCode("KOR")
    const taken = await prisma.booking.findUnique({
      where: { reference },
      select: { id: true },
    })
    if (!taken) return reference
  }
  throw new Error("Nie udało się wygenerować numeru rezerwacji.")
}

/** „Jan Kowalski" → imię + reszta jako nazwisko; jedno słowo zostaje imieniem. */
export function splitName(full: string) {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: null }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}
