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

/** Rzeczy, które psują się najczęściej: baza i dostawca logowania. */
export async function runHealthChecks(): Promise<HealthCheck[]> {
  return Promise.all([checkDatabase(), checkClerk()])
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
      label: "Płatności",
      value: process.env.STRIPE_SECRET_KEY
        ? "Stripe skonfigurowany"
        : "wyłączone (etap 5)",
    },
  ]
}
