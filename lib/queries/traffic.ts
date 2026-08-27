import { dayKey } from "@/lib/dates"
import { prisma } from "@/lib/prisma"

/**
 * Ruch na stronie z własnej tabeli `PageView`.
 *
 * Zewnętrzna analityka zostaje decyzją otwartą — własna tabela wystarcza na
 * start i nie dokłada zgód na ciasteczka (`docs/FRONTEND.md`, sekcja 10).
 */

export type TrafficSummary = {
  days: { label: string; value: number }[]
  totalViews: number
  sessions: number
  previousViews: number
  topPaths: { label: string; value: number }[]
  referrers: { label: string; value: number }[]
  devices: { label: string; value: number }[]
}

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Telefon",
  tablet: "Tablet",
  desktop: "Komputer",
}

export async function getTrafficSummary(days = 30): Promise<TrafficSummary> {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  from.setDate(from.getDate() - (days - 1))

  const previousFrom = new Date(from)
  previousFrom.setDate(previousFrom.getDate() - days)

  const [views, previousCount, sessions] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: from } },
      select: {
        path: true,
        referrer: true,
        device: true,
        sessionId: true,
        createdAt: true,
      },
    }),
    prisma.pageView.count({
      where: { createdAt: { gte: previousFrom, lt: from } },
    }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: from }, sessionId: { not: null } },
      distinct: ["sessionId"],
      select: { sessionId: true },
    }),
  ])

  // Pusty dzień musi zostać na wykresie — inaczej spadek do zera wygląda
  // jak brak danych, a nie jak brak ruchu.
  const buckets = new Map<string, number>()
  for (let offset = 0; offset < days; offset++) {
    const date = new Date(from)
    date.setDate(date.getDate() + offset)
    buckets.set(dayKey(date), 0)
  }

  const counters = {
    path: new Map<string, number>(),
    referrer: new Map<string, number>(),
    device: new Map<string, number>(),
  }

  for (const view of views) {
    const key = dayKey(view.createdAt)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)

    counters.path.set(view.path, (counters.path.get(view.path) ?? 0) + 1)
    const referrer = view.referrer ?? "wejście bezpośrednie"
    counters.referrer.set(referrer, (counters.referrer.get(referrer) ?? 0) + 1)
    const device = view.device ?? "nieznane"
    counters.device.set(device, (counters.device.get(device) ?? 0) + 1)
  }

  const top = (map: Map<string, number>, limit: number, label = (key: string) => key) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, value]) => ({ label: label(key), value }))

  return {
    days: [...buckets.entries()].map(([key, value]) => ({
      label: key.slice(8) + "." + key.slice(5, 7),
      value,
    })),
    totalViews: views.length,
    previousViews: previousCount,
    sessions: sessions.length,
    topPaths: top(counters.path, 10),
    referrers: top(counters.referrer, 6),
    devices: top(counters.device, 4, (key) => DEVICE_LABELS[key] ?? key),
  }
}
