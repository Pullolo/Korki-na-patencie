import { prisma } from "@/lib/prisma"

const FALLBACK = {
  id: "settings",
  siteName: "Korki na patencie",
  currency: "PLN",
}

/** Singleton ustawień; przy pierwszym wywołaniu zakłada rekord z domyślnymi wartościami. */
export async function getSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: "settings" },
  })
  if (existing) return existing
  return prisma.siteSettings.create({ data: { id: "settings" } })
}

/** Wersja dla layoutów — nigdy nie wywraca strony, gdy baza jeszcze nie stoi. */
export async function getSiteSettingsSafe() {
  try {
    return await getSiteSettings()
  } catch {
    return FALLBACK as Awaited<ReturnType<typeof getSiteSettings>>
  }
}
