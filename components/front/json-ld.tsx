/**
 * Dane strukturalne dla wyszukiwarek.
 *
 * `JSON.stringify` nie czyści znaczników, więc ucieczka z `<` jest tu
 * obowiązkowa — treść stron pisze admin w panelu i trafia tutaj bez zmian
 * (`node_modules/next/dist/docs/01-app/02-guides/json-ld.md`).
 *
 * Czego tu nie ma: `AggregateRating`. Ocena w danych strukturalnych to
 * deklaracja faktu, a `PRODUCT.md` zabrania podawania zmyślonych ocen —
 * wejdzie, gdy opinie przestaną być zaślepkami z seeda.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  )
}
