import { prisma } from "@/lib/prisma"

/**
 * Kody, które uczeń dyktuje przez telefon albo przepisuje z ekranu.
 * Alfabet bez znaków, które łatwo pomylić: bez 0/O i bez 1/I.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function randomCode(prefix: string, length = 4) {
  const code = Array.from(
    { length },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
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
