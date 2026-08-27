const STEPS = [
  {
    title: "Wybierasz termin",
    description:
      "Przedmiot, poziom i forma zajęć. Pokazujemy godziny, które są naprawdę wolne u konkretnego nauczyciela.",
  },
  {
    title: "Potwierdzamy rezerwację",
    description:
      "Dostajesz datę, miejsce i cenę. Nic nie płacisz z góry — rozliczamy się po zajęciach.",
  },
  {
    title: "Uczycie się",
    description:
      "Pierwsza lekcja to diagnoza: co siedzi, co nie siedzi i czego brakuje. Potem plan na kolejne tygodnie.",
  },
]

/**
 * Trzy kroki od wejścia na stronę do lekcji. To tekst redakcyjny, nie dane —
 * dlatego zostaje w komponencie, a nie w bazie: nie ma go czym sparametryzować
 * ani po co edytować w panelu osobno od reszty obietnicy produktu.
 */
export function StepsSection() {
  return (
    <section id="jak-to-dziala" className="bg-front-brand-soft">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <h2 className="max-w-[18ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
          Od pierwszej wiadomości do pierwszej lekcji
        </h2>

        <ol className="relative mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden
            className="absolute top-6 right-12 left-12 hidden border-t-2 border-dashed border-front-line-strong md:block"
          />
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--front-brand-solid)] font-display text-xl font-semibold text-[var(--front-on-brand)]">
                {index + 1}
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[42ch] leading-relaxed text-front-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
