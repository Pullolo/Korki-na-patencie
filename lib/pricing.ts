/**
 * Cennik zajęć indywidualnych.
 *
 * Reguła z pustym polem obejmuje wszystko: `{ level: matura }` dotyczy każdego
 * przedmiotu i nauczyciela. Im więcej pól wypełnionych, tym reguła bardziej
 * szczegółowa — i to ona wygrywa. Dzięki temu jeden cennik po poziomach
 * (80 / 100 / 120 zł) da się punktowo nadpisać dla konkretnego nauczyciela
 * albo przedmiotu, bez mnożenia wpisów dla każdej kombinacji.
 */

export type PriceRuleLike = {
  levelId: string | null
  subjectId: string | null
  teacherProfileId: string | null
  pricePerHour: number
  isActive?: boolean
}

export type PriceQuery = {
  levelId?: string | null
  subjectId?: string | null
  teacherProfileId?: string | null
}

/**
 * Nauczyciel bije przedmiot, przedmiot bije poziom. Wagi są rozłączne
 * (4 > 2 + 1), więc porównanie nigdy nie kończy się remisem między
 * regułami o różnym zestawie wypełnionych pól.
 */
export function ruleSpecificity(rule: PriceRuleLike) {
  return (
    (rule.teacherProfileId ? 4 : 0) +
    (rule.subjectId ? 2 : 0) +
    (rule.levelId ? 1 : 0)
  )
}

function matches(rule: PriceRuleLike, query: PriceQuery) {
  if (rule.isActive === false) return false
  if (rule.levelId && rule.levelId !== query.levelId) return false
  if (rule.subjectId && rule.subjectId !== query.subjectId) return false
  if (
    rule.teacherProfileId &&
    rule.teacherProfileId !== query.teacherProfileId
  ) {
    return false
  }
  return true
}

/** Zwraca najbardziej szczegółową pasującą regułę albo null. */
export function findPriceRule<T extends PriceRuleLike>(
  rules: T[],
  query: PriceQuery
): T | null {
  let best: T | null = null
  let bestScore = -1

  for (const rule of rules) {
    if (!matches(rule, query)) continue
    const score = ruleSpecificity(rule)
    if (score > bestScore) {
      best = rule
      bestScore = score
    }
  }
  return best
}

export function resolveHourlyPrice(
  rules: PriceRuleLike[],
  query: PriceQuery
): number | null {
  return findPriceRule(rules, query)?.pricePerHour ?? null
}

/** Widełki dla listy kombinacji — np. „od 80 do 120 zł" na profilu nauczyciela. */
export function priceRange(
  rules: PriceRuleLike[],
  queries: PriceQuery[]
): { min: number; max: number } | null {
  const prices = queries
    .map((query) => resolveHourlyPrice(rules, query))
    .filter((price): price is number => price !== null)

  if (prices.length === 0) return null
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

/** Cena grupy po rabacie, zaokrąglona do pełnych złotych. */
export function applyDiscount(price: number, discountPercent: number) {
  if (discountPercent <= 0) return price
  return Math.round(price * (1 - discountPercent / 100))
}

/** Ile kosztuje godzina zajęć grupowych — do porównania z indywidualnymi. */
export function groupHourlyEquivalent(group: {
  pricePerMonth: number
  meetingsPerMonth: number
  meetingMinutes: number
}) {
  const hours = (group.meetingsPerMonth * group.meetingMinutes) / 60
  if (hours <= 0) return null
  return Math.round(group.pricePerMonth / hours)
}
