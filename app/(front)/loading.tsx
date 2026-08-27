/**
 * Szkielet ładowania. Nie kręcimy spinnerem — pokazujemy kształt strony,
 * którą za chwilę zobaczy czytelnik.
 */
export default function FrontLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6" aria-busy>
      <span className="sr-only">Wczytujemy stronę…</span>
      <div className="h-4 w-28 animate-pulse rounded-full bg-front-line" />
      <div className="mt-6 h-12 w-3/4 animate-pulse rounded-2xl bg-front-line" />
      <div className="mt-4 h-5 w-1/2 animate-pulse rounded-full bg-front-line" />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-52 animate-pulse rounded-3xl border border-front-line bg-front-surface"
          />
        ))}
      </div>
    </div>
  )
}
