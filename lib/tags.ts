import { revalidateTag } from "next/cache"

/**
 * Tagi cache'a strony publicznej.
 *
 * Front czyta katalog przez `unstable_cache` (patrz `lib/public/cache.ts`),
 * więc zmiana w panelu musi unieważnić odpowiedni tag — inaczej strona
 * pokazywałaby stary cennik albo ukrytego nauczyciela. `revalidatePath`
 * z akcji panelu odświeża tylko panel.
 */
export const TAGS = {
  /** Przedmioty i poziomy. */
  katalog: "katalog",
  /** Profile nauczycieli, ich przedmioty i lokalizacje. */
  nauczyciele: "nauczyciele",
  /** Reguły cenowe. */
  cennik: "cennik",
  /** Definicje grup — nie liczba wolnych miejsc, tej nigdy nie cache'ujemy. */
  grupy: "grupy",
  /** Opinie zatwierdzone przez moderację. */
  opinie: "opinie",
  /** Strony CMS, nawigacja, FAQ. */
  cms: "cms",
  /** Singleton `SiteSettings`. */
  ustawienia: "ustawienia",
} as const

export type CacheTag = (typeof TAGS)[keyof typeof TAGS]

/**
 * Drugi argument `revalidateTag` jest w Next 16 obowiązkowy — wywołanie
 * jednoargumentowe jest wycofane. "max" daje stale-while-revalidate.
 */
export function revalidateTags(...tags: CacheTag[]) {
  for (const tag of tags) revalidateTag(tag, "max")
}
