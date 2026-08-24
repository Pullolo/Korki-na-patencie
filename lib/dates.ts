/**
 * Pomocniki do dat kalendarzowych.
 *
 * Główna pułapka w tym projekcie: `toISOString()` przelicza datę na UTC, więc
 * przy dodatnim offsecie strefy początek dnia albo miesiąca ląduje w poprzednim.
 * Dlatego klucze budujemy z lokalnych składowych, a kolumny `@db.Date`
 * (które nie mają godziny i wracają jako północ UTC) czytamy getterami UTC.
 */

const monthFormatter = new Intl.DateTimeFormat("pl-PL", { month: "short" })

/** Klucz "RRRR-MM-DD" z lokalnych składowych daty. */
export function dayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

/** Klucz "RRRR-MM" z lokalnych składowych daty. */
export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/** "2026-08" → "sie". */
export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number)
  return monthFormatter.format(new Date(year, month - 1, 1)).replace(".", "")
}

/** Odczyt kolumny `@db.Date` — bez getterów UTC data uciekłaby o dzień. */
export function dateOnlyKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-")
}

/** Zapis do kolumny `@db.Date` — zawsze północ UTC. */
export function toDateOnly(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

/** Dzień tygodnia w konwencji ISO: 1 = poniedziałek … 7 = niedziela. */
export function isoWeekday(date: Date) {
  const day = date.getDay()
  return day === 0 ? 7 : day
}
