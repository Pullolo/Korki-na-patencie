import { randomBytes } from "node:crypto"

import { prisma } from "@/lib/prisma"

/** Zgodne z `v.referenceCode`, które przepuszcza 4–8 znaków (stare kody). */
const CODE_LENGTH = 8

/**
 * Kody, które uczeń dyktuje przez telefon albo przepisuje z ekranu.
 * Alfabet bez znaków, które łatwo pomylić: bez 0/O i bez 1/I.
 *
 * **Długość jest sprawą bezpieczeństwa, nie kosmetyki.** Kod jest jedynym
 * kluczem do strony `/rezerwacja/[kod]`: pokazuje termin i wiadomość ucznia,
 * i pozwala lekcję odwołać. Cztery znaki to nieco ponad milion kombinacji —
 * przy kilkuset rezerwacjach w bazie ślepe zgadywanie trafia w rozsądnym
 * czasie. Osiem znaków to ~1,1 × 10¹², czyli poza zasięgiem skanera.
 * Drugą warstwą jest limit prób z adresu (`lib/actions/public/guard.ts`).
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function randomCode(prefix: string, length = CODE_LENGTH) {
  // `Math.random()` nie jest przewidziany do sekretów — kod rezerwacji nim
  // jest, więc losujemy z generatora kryptograficznego.
  const bytes = randomBytes(length)
  const code = Array.from(
    bytes,
    (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]
  ).join("")
  return `${prefix}-${code}`
}

async function uniqueCode(
  prefix: string,
  taken: (code: string) => Promise<boolean>
) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomCode(prefix)
    if (!(await taken(code))) return code
  }
  throw new Error("Nie udało się wygenerować kodu.")
}

export function uniqueBookingReference() {
  return uniqueCode("KOR", async (reference) =>
    Boolean(
      await prisma.booking.findUnique({
        where: { reference },
        select: { id: true },
      })
    )
  )
}

export function uniqueEnrollmentReference() {
  return uniqueCode("GRP", async (reference) =>
    Boolean(
      await prisma.groupEnrollment.findUnique({
        where: { reference },
        select: { id: true },
      })
    )
  )
}

/** „Jan Kowalski" → imię + reszta jako nazwisko; jedno słowo zostaje imieniem. */
export function splitName(full: string) {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: null }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}
