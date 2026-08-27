import {
  ArrowRight,
  Atom,
  Braces,
  ChevronDown,
  CircleCheck,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Sigma,
  Star,
  Users,
  Video,
  Wallet,
} from "lucide-react"

import { ArrowDoodle, Squiggle } from "@/components/front/doodles"
import { Marker } from "@/components/front/marker"
import { SlotPicker } from "@/components/front/slot-picker"
import {
  btnPrimary,
  btnSecondary,
  cardBase,
  chip,
  sampleTag,
} from "@/components/front/styles"
import { cn } from "@/lib/utils"

// Landing. Nagłówek, stopka i fonty mieszkają w `app/(front)/layout.tsx`.
// Kierunek wizualny: kontrakt w `app/layout.tsx`, zapis w `DESIGN.md`.
//
// Treść jest jeszcze wpisana na twardo — dane z bazy wchodzą w kroku M1
// (`docs/FRONTEND.md`, sekcja 12). Zaślepki są oznaczone `sampleTag`.

const HERO_FACTS = [
  { icon: Wallet, label: "Płacisz po lekcji" },
  { icon: Clock3, label: "Odwołanie do 12 h przed" },
  { icon: Video, label: "Online albo na miejscu" },
]

const SUBJECTS = [
  {
    icon: Sigma,
    name: "Matematyka",
    tone: "bg-front-brand-soft text-front-brand",
    description:
      "Od ułamków po całki. Bieżący materiał, sprawdziany i przygotowanie do matury rozszerzonej.",
    levels: ["Podstawówka", "Liceum", "Matura", "Studia"],
    from: 80,
  },
  {
    icon: Atom,
    name: "Fizyka",
    tone: "bg-front-sky-soft text-front-sky",
    description:
      "Mechanika, elektryczność, termodynamika. Zadania rozkładane na części, dopóki nie zaczną być oczywiste.",
    levels: ["Podstawówka", "Liceum", "Matura"],
    from: 80,
  },
  {
    icon: Braces,
    name: "Informatyka",
    tone: "bg-front-mint-soft text-front-mint",
    description:
      "Algorytmy, struktury danych, Python i C++. Matura, olimpiady i pierwsze lata studiów.",
    levels: ["Liceum", "Matura", "Studia"],
    from: 100,
  },
]

const STEPS = [
  {
    title: "Wybierasz termin",
    description:
      "Przedmiot, poziom i forma zajęć. Pokazujemy godziny, które są naprawdę wolne u konkretnego nauczyciela.",
  },
  {
    title: "Potwierdzamy rezerwację",
    description:
      "Dostajesz datę, miejsce i cenę. Nic nie płacisz z góry — rozliczamy się po zajęciach.",
  },
  {
    title: "Uczycie się",
    description:
      "Pierwsza lekcja to diagnoza: co siedzi, co nie siedzi i czego brakuje. Potem plan na kolejne tygodnie.",
  },
]

// ZAŚLEPKI: nazwiska, opisy i liczby wolnych godzin są przykładowe.
const TEACHERS = [
  {
    initials: "AK",
    name: "Anna Kowalska",
    tone: "bg-front-brand-soft text-front-brand",
    subjects: ["Matematyka", "Fizyka"],
    bio: "Uczy do matury rozszerzonej od ośmiu lat. Prowadzi też grupę maturalną w czwartki.",
    free: 6,
  },
  {
    initials: "PN",
    name: "Piotr Nowak",
    tone: "bg-front-sky-soft text-front-sky",
    subjects: ["Fizyka", "Matematyka"],
    bio: "Egzamin ósmoklasisty i liceum. Lubi zaczynać od zadań, które uczeń już prawie umie.",
    free: 4,
  },
  {
    initials: "MZ",
    name: "Marta Zielińska",
    tone: "bg-front-mint-soft text-front-mint",
    subjects: ["Informatyka"],
    bio: "Python, C++ i algorytmy. Przygotowuje do matury rozszerzonej i olimpiady.",
    free: 5,
  },
]

const PRICING = [
  {
    level: "Podstawówka",
    description: "Klasy 4–8, w tym przygotowanie do egzaminu ósmoklasisty.",
    price: 80,
  },
  {
    level: "Szkoła średnia",
    description: "Bieżący materiał, sprawdziany i poprawa ocen w liceum oraz technikum.",
    price: 100,
  },
  {
    level: "Matura",
    description: "Podstawa i rozszerzenie, arkusze, powtórka całego zakresu.",
    price: 120,
  },
]

const GROUPS = [
  {
    name: "Grupa ósmoklasisty",
    price: 250,
    meta: "4 spotkania × 60 min w miesiącu",
    points: ["Grupy 4–8 osób", "Stały termin w tygodniu", "Materiały po każdym spotkaniu"],
  },
  {
    name: "Grupa maturalna",
    price: 350,
    meta: "4 spotkania × 90 min w miesiącu",
    points: ["Grupy 4–8 osób", "Arkusze z poprzednich lat", "Powtórka całego zakresu"],
  },
]

// ZAŚLEPKI: opinie są przykładowe i tak oznaczone na stronie.
const REVIEWS = [
  {
    quote:
      "Syn wszedł na zajęcia z jedynką ze sprawdzianu, a po dwóch miesiącach tłumaczył koledze funkcje kwadratowe.",
    author: "Anna",
    role: "mama ucznia, 2. klasa liceum",
    tone: "bg-front-brand-soft text-front-brand",
    initials: "A",
  },
  {
    quote:
      "Najbardziej pomogło to, że nie robiliśmy wszystkiego po kolei, tylko tego, co mi nie wychodziło.",
    author: "Kuba",
    role: "matura rozszerzona z matematyki",
    tone: "bg-front-sky-soft text-front-sky",
    initials: "K",
  },
  {
    quote:
      "Online działa u nas lepiej niż dojazdy. Tablica, zapis lekcji i zadania na kolejny tydzień w jednym miejscu.",
    author: "Marta",
    role: "mama ósmoklasistki",
    tone: "bg-front-mint-soft text-front-mint",
    initials: "M",
  },
]

const FAQ = [
  {
    question: "Jak wygląda pierwsza lekcja?",
    answer:
      "Sprawdzamy, gdzie naprawdę jest problem — zwykle nie tam, gdzie ostatni sprawdzian. Wychodzisz z planem na kolejne tygodnie i nie zobowiązujesz się do żadnego pakietu.",
  },
  {
    question: "Online czy stacjonarnie?",
    answer:
      "Obie formy kosztują tyle samo. Online prowadzimy na tablicy, na której widać cały tok rozwiązania, a zapis zostaje u ucznia. Stacjonarnie — u nauczyciela albo z dojazdem, jeśli mieścisz się w zasięgu.",
  },
  {
    question: "Kiedy najpóźniej mogę odwołać lekcję?",
    answer:
      "Do 12 godzin przed terminem, bez żadnych kosztów. Później termin przepada, bo zwykle nie da się już wstawić w to miejsce nikogo innego.",
  },
  {
    question: "Czym różnią się zajęcia grupowe od indywidualnych?",
    answer:
      "Grupa ma stały termin w tygodniu, 4–8 osób i rozliczenie miesięczne — wychodzi taniej, ale tempo jest wspólne. Zajęcia indywidualne idą dokładnie tam, gdzie potrzebuje uczeń.",
  },
  {
    question: "Jak płacę za zajęcia?",
    answer:
      "Po lekcji: gotówką albo przelewem. Zajęcia grupowe rozliczamy z góry za miesiąc, niezależnie od tego, ile spotkań wypada w kalendarzu.",
  },
  {
    question: "Czy uczeń musi mieć konto?",
    answer:
      "Nie. Termin można umówić bez zakładania konta — konto przydaje się tylko wtedy, gdy chcesz mieć historię lekcji w jednym miejscu.",
  },
]

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-front-ground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--front-dots)_1.1px,transparent_1.1px)] [background-size:22px_22px] opacity-60"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <h1 className="font-display text-[2.6rem] leading-[1.18] font-semibold tracking-[-0.02em] text-balance sm:text-6xl">
              Zobacz{" "}
              <span className="relative inline-block whitespace-nowrap">
                wolną godzinę
                <Squiggle className="absolute -bottom-1 left-0 h-[0.3em] w-full text-front-brand" />
              </span>{" "}
              <span className="whitespace-nowrap">i zapisz się</span> w minutę
            </h1>

            <p className="mt-7 max-w-[46ch] text-lg leading-relaxed text-front-muted">
              Matematyka, fizyka i informatyka — z nauczycielem, który
              tłumaczy do skutku. Grafik na stronie jest prawdziwy: godzina,
              którą widzisz, jest naprawdę wolna, a cenę znasz, zanim
              napiszesz pierwszą wiadomość.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#kontakt" className={btnPrimary}>
                Umów lekcję
                <ArrowRight />
              </a>
              <a href="#jak-to-dziala" className={btnSecondary}>
                Jak to działa
              </a>
            </div>

            <ul className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {HERO_FACTS.map((fact) => (
                <li
                  key={fact.label}
                  className="flex items-center gap-2 font-semibold text-front-ink"
                >
                  <fact.icon className="size-5 text-front-brand" />
                  {fact.label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-2 hidden items-end gap-2 pl-6 lg:flex">
              <ArrowDoodle className="h-12 w-14 shrink-0 text-front-brand" />
              <p className="max-w-[24ch] pb-3 font-display text-base leading-snug font-semibold text-front-muted">
                tu wybierasz godzinę, a nie wypełniasz formularz
              </p>
            </div>

            <SlotPicker />
          </div>
        </div>
      </section>

      {/* ── Przedmioty ───────────────────────────────────────────────── */}
      <section id="przedmioty" className="bg-front-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <h2 className="max-w-[20ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
            Trzy przedmioty, w których jesteśmy{" "}
            <Marker tone="bg-front-mint-soft">naprawdę dobrzy</Marker>
          </h2>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-front-muted">
            Nie bierzemy wszystkiego, co się nawinie. Za to w tych trzech
            doprowadzamy ucznia do momentu, w którym przestaje nas
            potrzebować.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {SUBJECTS.map((subject) => (
              <article
                key={subject.name}
                className={cn(
                  cardBase,
                  "flex flex-col p-6 transition-transform duration-200 hover:-translate-y-1"
                )}
              >
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl",
                    subject.tone
                  )}
                >
                  <subject.icon className="size-6" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">
                  {subject.name}
                </h3>
                <p className="mt-2 flex-1 leading-relaxed text-front-muted">
                  {subject.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {subject.levels.map((level) => (
                    <span
                      key={level}
                      className={cn(chip, "bg-front-ground text-front-muted")}
                    >
                      {level}
                    </span>
                  ))}
                </div>
                <p className="mt-5 border-t border-front-line pt-4 font-semibold">
                  od{" "}
                  <span className="font-display text-2xl">
                    {subject.from} zł
                  </span>{" "}
                  <span className="text-front-muted">/ 60 min</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Jak to działa ────────────────────────────────────────────── */}
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

      {/* ── Nauczyciele ──────────────────────────────────────────────── */}
      <section id="nauczyciele" className="bg-front-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <h2 className="max-w-[16ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
            Ludzie, którzy będą uczyć
          </h2>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-front-muted">
            <span className={sampleTag}>profile przykładowe</span>
            prawdziwe wejdą z panelu, razem z ich grafikiem
          </p>

          <div
            className={cn(
              cardBase,
              "mt-10 divide-y divide-front-line overflow-hidden"
            )}
          >
            {TEACHERS.map((teacher) => (
              <article key={teacher.name} className="p-6 sm:px-8">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  <span
                    className={cn(
                      "flex size-14 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-semibold",
                      teacher.tone
                    )}
                  >
                    {teacher.initials}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl font-semibold tracking-tight">
                      {teacher.name}
                    </h3>
                    <p className="text-sm font-semibold text-front-muted">
                      {teacher.subjects.join(" · ")}
                    </p>
                  </div>

                  <p className="flex w-full shrink-0 items-center gap-2 font-semibold whitespace-nowrap sm:w-auto">
                    <Clock3 className="size-5 text-front-mint" />
                    {teacher.free} wolnych godzin
                  </p>
                </div>

                <p className="mt-3 leading-relaxed text-front-muted sm:pl-19">
                  {teacher.bio}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cennik ───────────────────────────────────────────────────── */}
      <section id="cennik" className="bg-front-ground">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <h2 className="max-w-[20ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
            Cena zależy{" "}
            <span className="whitespace-nowrap">
              <Marker tone="bg-front-sky-soft">od poziomu</Marker>,
            </span>{" "}
            nie od tego, jak pilne
          </h2>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-front-muted">
            Jedna stawka za godzinę zegarową — online i stacjonarnie tak
            samo. Płatność po lekcji.
          </p>

          <div
            className={cn(cardBase, "mt-12 divide-y divide-front-line overflow-hidden")}
          >
            {PRICING.map((tier) => (
              <div
                key={tier.level}
                className="flex flex-wrap items-center justify-between gap-4 p-6 sm:px-8"
              >
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {tier.level}
                  </h3>
                  <p className="mt-1 max-w-[52ch] leading-relaxed text-front-muted">
                    {tier.description}
                  </p>
                </div>
                <p className="shrink-0 whitespace-nowrap">
                  <span className="font-display text-3xl font-semibold">
                    {tier.price} zł
                  </span>
                  <span className="ml-1 font-semibold text-front-muted">
                    / 60 min
                  </span>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
            {GROUPS.map((group) => (
              <article key={group.name} className={cn(cardBase, "p-6 sm:p-8")}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {group.name}
                  </h3>
                  <p className="whitespace-nowrap">
                    <span className="font-display text-3xl font-semibold">
                      {group.price} zł
                    </span>
                    <span className="ml-1 font-semibold text-front-muted">
                      / mies.
                    </span>
                  </p>
                </div>
                <p className="mt-1 font-semibold text-front-muted">
                  {group.meta}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {group.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CircleCheck className="mt-0.5 size-5 shrink-0 text-front-mint" />
                      <span className="text-front-muted">{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <p className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-front-sun-soft px-5 py-4 font-semibold text-front-ink">
            <Users className="size-5 text-front-sun" />
            Uczysz się u nas indywidualnie? Zajęcia grupowe masz 20% taniej —
            rabat naliczamy przy zapisie.
          </p>
        </div>
      </section>

      {/* ── Opinie ───────────────────────────────────────────────────── */}
      <section className="bg-[var(--front-band-warm)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <h2 className="max-w-[16ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
            Co mówią uczniowie i rodzice
          </h2>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-front-muted">
            <span className={sampleTag}>opinie przykładowe</span>
            tu wejdą wypowiedzi zatwierdzone w panelu
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-start">
            {REVIEWS.map((review, index) => (
              <figure
                key={review.author}
                className={cn(
                  cardBase,
                  "flex flex-col p-6",
                  ["-rotate-1", "rotate-[0.7deg] md:mt-8", "-rotate-[0.5deg] md:mt-16"][
                    index
                  ]
                )}
              >
                <div aria-hidden className="flex gap-0.5 text-front-sun">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-4.5 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-lg leading-relaxed">
                  {review.quote}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-front-line pt-4">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl font-display font-semibold",
                      review.tone
                    )}
                  >
                    {review.initials}
                  </span>
                  <span>
                    <span className="block font-semibold">{review.author}</span>
                    <span className="block text-sm text-front-muted">
                      {review.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="pytania" className="bg-front-surface">
        <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-6 sm:py-24">
          <h2 className="font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
            Pytania, które padają najczęściej
          </h2>

          <div
            className={cn(cardBase, "mt-10 divide-y divide-front-line overflow-hidden")}
          >
            {FAQ.map((item) => (
              <details key={item.question} className="group px-6 sm:px-7">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-front-ground text-front-brand transition-transform duration-200 group-open:rotate-180">
                    <ChevronDown className="size-5" />
                  </span>
                </summary>
                <p className="max-w-[68ch] pb-5 leading-relaxed text-front-muted">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kontakt ──────────────────────────────────────────────────── */}
      <section id="kontakt" className="bg-front-ground px-5 pt-20 pb-20 sm:px-6 sm:pt-24 sm:pb-24">
        <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[32px] bg-[var(--front-cta)] px-6 py-16 text-center sm:px-12">
          <h2 className="mx-auto max-w-[18ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance text-[var(--front-on-cta)] sm:text-5xl">
            Napisz, z czym jest problem
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-lg leading-relaxed text-[var(--front-on-cta-muted)]">
            Odpowiadamy tego samego dnia i od razu proponujemy wolny
            termin. Pierwsza lekcja nie zobowiązuje do niczego dalej.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href="tel:+48000000000"
              className={cn(
                btnPrimary,
                "bg-[var(--front-on-cta)] text-[var(--front-cta)] shadow-[0_4px_0_0_var(--front-cta-pill-edge)] hover:bg-[var(--front-on-cta-muted)] active:shadow-[0_1px_0_0_var(--front-cta-pill-edge)]"
              )}
            >
              <Phone />
              +48 000 000 000
            </a>
            <a
              href="mailto:kontakt@korkinapatencie.pl"
              className={cn(
                btnSecondary,
                "border-[var(--front-cta-border)] bg-transparent text-[var(--front-on-cta)] shadow-[0_4px_0_0_var(--front-cta-edge)] hover:border-[var(--front-on-cta)] active:shadow-[0_1px_0_0_var(--front-cta-edge)]"
              )}
            >
              <Mail />
              kontakt@korkinapatencie.pl
            </a>
          </div>

          <p className="mt-7 flex items-center justify-center gap-2 font-semibold text-[var(--front-on-cta-muted)]">
            <MapPin className="size-5" />
            Online w całej Polsce · stacjonarnie w Krakowie
          </p>
        </div>
      </section>
    </>
  )
}
