/** "Język polski" → "jezyk-polski". Diakrytyki rozkładamy i obcinamy. */
export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // ł nie ma formy rozłożonej, więc nie zdejmie jej normalizacja.
      .replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  )
}

/**
 * Dokłada licznik, dopóki slug jest zajęty. `exists` pyta bazę o konkretną tabelę.
 * `currentId` pozwala zachować własny slug przy edycji rekordu.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<string | null>,
  options: { fallback?: string; currentId?: string } = {}
) {
  const root = slugify(base) || options.fallback || "pozycja"
  let candidate = root
  let suffix = 2

  for (;;) {
    const foundId = await exists(candidate)
    if (!foundId || foundId === options.currentId) return candidate
    candidate = `${root}-${suffix++}`
  }
}
