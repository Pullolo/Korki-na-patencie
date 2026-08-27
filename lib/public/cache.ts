import { unstable_cache } from "next/cache"

import type { CacheTag } from "@/lib/tags"

/**
 * Opakowanie `unstable_cache` dla warstwy publicznej.
 *
 * Cache Components (`use cache`) to przełącznik na całą aplikację i zmienia
 * model renderowania także w panelu — do czasu osobnego przejścia zostajemy
 * przy modelu z tagami (`docs/FRONTEND.md`, sekcja 7).
 *
 * Wewnątrz funkcji cache'owanej nie wolno czytać `headers()` ani `cookies()`.
 * Wszystko, co zależy od żądania, przekazujemy argumentem.
 */
export function cachedQuery<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  tags: CacheTag[],
  revalidateSeconds = 300
) {
  return unstable_cache(fn, keyParts, {
    tags,
    revalidate: revalidateSeconds,
  })
}
