import { cachedQuery } from "@/lib/public/cache"
import type { PriceQuery, PriceRuleLike } from "@/lib/pricing"
import { findPriceRule, priceRange, resolveHourlyPrice } from "@/lib/pricing"
import { prisma } from "@/lib/prisma"
import { TAGS } from "@/lib/tags"

/**
 * Cennik dla strony publicznej.
 *
 * Front nigdy nie liczy ceny sam — nawet „na szybko" w landingu. Reguła
 * najbardziej szczegółowa wygrywa, a wybiera ją `resolveHourlyPrice()`
 * (`lib/pricing.ts`). Tutaj tylko pobieramy reguły i cache'ujemy je pod tagiem.
 */

type PublicPriceRule = PriceRuleLike & { note: string | null }

const loadRules = cachedQuery(
  async (): Promise<PublicPriceRule[]> =>
    prisma.priceRule.findMany({
      where: { isActive: true },
      select: {
        levelId: true,
        subjectId: true,
        teacherProfileId: true,
        pricePerHour: true,
        note: true,
      },
    }),
  ["public-price-rules"],
  [TAGS.cennik]
)

export async function getPriceRules(): Promise<PublicPriceRule[]> {
  try {
    return await loadRules()
  } catch {
    return []
  }
}

export async function priceFor(query: PriceQuery) {
  return resolveHourlyPrice(await getPriceRules(), query)
}

export async function priceRangeFor(queries: PriceQuery[]) {
  return priceRange(await getPriceRules(), queries)
}

/**
 * Tabela „poziom → stawka" na stronę cennika. Pytamy o sam poziom, więc
 * dostajemy regułę bazową, a nie punktowe nadpisanie dla nauczyciela.
 */
export async function getPriceTable(
  levels: { id: string; name: string; slug: string }[]
) {
  const rules = await getPriceRules()
  return levels.map((level) => {
    const rule = findPriceRule(rules, { levelId: level.id })
    return {
      level,
      pricePerHour: rule?.pricePerHour ?? null,
      // Notatka z reguły cenowej jest jedynym opisem poziomu, jaki mamy —
      // model `Level` nie ma własnego pola na zdanie o tym, co obejmuje.
      note: rule?.note ?? null,
    }
  })
}
