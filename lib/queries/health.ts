import { emailEnabled } from "@/lib/email"
import { plural } from "@/lib/format"
import { prisma } from "@/lib/prisma"

export type HealthCheck = {
  name: string
  ok: boolean
  latencyMs: number | null
  detail: string
}

async function timed<T>(fn: () => Promise<T>) {
  const started = Date.now()
  try {
    const value = await fn()
    return { value, latencyMs: Date.now() - started, error: null as unknown }
  } catch (error) {
    return { value: null, latencyMs: Date.now() - started, error }
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const { value, latencyMs, error } = await timed(async () => {
    await prisma.$queryRaw`SELECT 1`
    return prisma.booking.count()
  })

  if (error) {
    return {
      name: "Baza danych",
      ok: false,
      latencyMs,
      detail:
        error instanceof Error
          ? error.message.split("\n")[0]
          : "Brak połączenia z PostgreSQL.",
    }
  }
  return {
    name: "Baza danych",
    ok: true,
    latencyMs,
    detail: `PostgreSQL odpowiada, ${value} ${plural(value ?? 0, "rezerwacja", "rezerwacje", "rezerwacji")} w tabeli.`,
  }
}

async function checkClerk(): Promise<HealthCheck> {
  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) {
    return {
      name: "Clerk",
      ok: false,
      latencyMs: null,
      detail: "Brak CLERK_SECRET_KEY w zmiennych środowiskowych.",
    }
  }

  const { value, latencyMs, error } = await timed(async () => {
    const response = await fetch("https://api.clerk.com/v1/users/count", {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    })
    if (!response.ok) throw new Error(`Clerk API zwróciło ${response.status}`)
    return (await response.json()) as { object: string; total_count: number }
  })

  if (error) {
    return {
      name: "Clerk",
      ok: false,
      latencyMs,
      detail:
        error instanceof Error ? error.message : "Clerk API nie odpowiada.",
    }
  }
  return {
    name: "Clerk",
    ok: true,
    latencyMs,
    detail: `Uwierzytelnianie działa, ${value?.total_count ?? 0} ${plural(value?.total_count ?? 0, "konto", "konta", "kont")} w instancji.`,
  }
}

/**
 * Poczta nie jest usługą, którą się „odpytuje" — sprawdzamy konfigurację,
 * bo najczęstsza awaria to jej brak, a ta jest cicha: rezerwacje wpadają
 * normalnie, tylko nikt nie dostaje maila.
 */
function checkEmail(): HealthCheck {
  const configured = emailEnabled()
  return {
    name: "Poczta",
    ok: configured,
    latencyMs: null,
    detail: configured
      ? "Maile transakcyjne włączone (potwierdzenia i decyzje idą do ucznia)."
      : "Brak RESEND_API_KEY albo EMAIL_FROM — uczeń nie dostanie kodu rezerwacji, a nauczyciel powiadomienia o zgłoszeniu.",
  }
}

/**
 * Adres serwisu wchodzi do canonicali, mapy witryny, obrazów OG i linków
 * w mailach. Zostawiony na localhoście psuje je wszystkie naraz i po cichu.
 */
function checkSiteUrl(): HealthCheck {
  const value = process.env.NEXT_PUBLIC_SITE_URL
  const local = !value || /localhost|127\.0\.0\.1/.test(value)
  const production = process.env.NODE_ENV === "production"

  if (!local) {
    return {
      name: "Adres serwisu",
      ok: true,
      latencyMs: null,
      detail: `Linki w mailach, canonical i mapa witryny budowane z „${value}".`,
    }
  }

  // Lokalnie adres na localhoście jest w porządku i nie ma o czym mówić;
  // dopiero na produkcji oznacza, że wszystkie linki wychodzą donikąd.
  return {
    name: "Adres serwisu",
    ok: !production,
    latencyMs: null,
    detail: production
      ? `NEXT_PUBLIC_SITE_URL ${value ? `wskazuje na „${value}"` : "nie jest ustawiony"} — linki w mailach i mapie witryny prowadzą donikąd.`
      : `Adres deweloperski „${value ?? "http://localhost:3000"}" — na produkcji ustaw NEXT_PUBLIC_SITE_URL na prawdziwą domenę.`,
  }
}

/** Rzeczy, które psują się najczęściej: baza, logowanie, poczta i adres. */
export async function runHealthChecks(): Promise<HealthCheck[]> {
  const [database, clerk] = await Promise.all([checkDatabase(), checkClerk()])
  return [database, clerk, checkEmail(), checkSiteUrl()]
}

/** Konfiguracja, którą warto mieć pod ręką przy diagnozie. */
export function environmentSummary() {
  return [
    {
      label: "Środowisko",
      value: process.env.NODE_ENV ?? "nieznane",
    },
    {
      label: "Adres serwisu",
      value: process.env.NEXT_PUBLIC_SITE_URL ?? "nie ustawiony",
    },
    {
      label: "Klucz Clerk",
      value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith(
        "pk_live"
      )
        ? "produkcyjny"
        : "deweloperski",
    },
    {
      label: "Poczta",
      value: emailEnabled() ? "Resend skonfigurowany" : "wyłączona",
    },
    {
      label: "Płatności",
      value: process.env.STRIPE_SECRET_KEY
        ? "Stripe skonfigurowany"
        : "wyłączone (etap 5)",
    },
  ]
}
