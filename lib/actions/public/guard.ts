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

/**
 * Klucz do podpisywania znaczników formularza.
 *
 * `CLERK_SECRET_KEY` jest awaryjnym źródłem, ale nigdy nie używamy go wprost:
 * jeden sekret w dwóch rolach oznacza, że wyciek podpisu z formularza jest
 * podpowiedzią o kluczu do API Clerka. Domieszka etykiety rozdziela te role.
 *
 * Na produkcji bez któregokolwiek z tych dwóch nie podpisujemy nic — cicha
 * praca na stałej z kodu znaczyłaby, że każdy potrafi sfałszować znacznik.
 */
function secret() {
  const raw = process.env.FORM_SECRET ?? process.env.CLERK_SECRET_KEY
  if (raw) return createHmac("sha256", raw).update("korki:form-stamp").digest()

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Brak FORM_SECRET (ani CLERK_SECRET_KEY) — formularzy publicznych nie da się bezpiecznie podpisać."
    )
  }
  return Buffer.from("korki-dev-secret")
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url")
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
 *
 * **Uwaga przy wdrożeniu bezserwerowym** (Vercel i podobne): każda instancja
 * ma własną mapę, więc realny limit to `limit × liczba instancji`. Dla
 * formularzy to bez znaczenia — twardą granicę trzyma licznik w bazie. Dla
 * `tooManyCodeLookups()` i licznika odsłon nie ma takiego dublera, więc gdy
 * serwis ruszy na wielu instancjach, ten licznik trzeba przenieść do
 * wspólnego magazynu (Redis / Vercel KV). Do czasu jednej instancji wystarcza.
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
export async function recentBookingCount(
  email: string | null,
  phone: string | null
) {
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

export async function recentEnrollmentCount(
  email: string | null,
  phone: string | null
) {
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

/**
 * Limit prób odczytania cudzego zgłoszenia po kodzie.
 *
 * Kod jest kluczem dostępu, więc strony `/rezerwacja/[kod]` i `/zapis/[kod]`
 * to jedyne miejsca, gdzie nieznajomy może zgadywać. Sam kod jest już na tyle
 * długi, że zgadywanie nie ma sensu (`lib/reference.ts`), ale licznik
 * odbiera skanerowi nawet tę próbę — i robi to na tyle wysoko ustawiony,
 * żeby uczeń odświeżający swoją stronę nigdy go nie dotknął.
 */
export async function tooManyCodeLookups(action: "booking" | "enrollment") {
  const ip = await clientIp()
  return tooManyFromAddress(ip, `lookup:${action}`, {
    limit: 30,
    windowMs: 600_000,
  })
}
