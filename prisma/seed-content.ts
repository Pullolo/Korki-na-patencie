import type { PrismaClient } from "../lib/generated/prisma/client"

/**
 * Treść, która na stronie publicznej ma pochodzić z panelu, a nie z kodu:
 * pytania i odpowiedzi, menu oraz strony CMS.
 *
 * Wszystko wstawiamy tylko wtedy, gdy tabela jest pusta — po pierwszej edycji
 * w panelu seed nie ma prawa nadpisać cudzej pracy.
 */
export async function seedContent(prisma: PrismaClient, siteName: string) {
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: [
        {
          question: "Jak wygląda pierwsza lekcja?",
          answer:
            "Sprawdzamy, gdzie naprawdę jest problem — zwykle nie tam, gdzie ostatni sprawdzian. Wychodzisz z planem na kolejne tygodnie i nie zobowiązujesz się do żadnego pakietu.",
          category: "Zajęcia",
          order: 1,
        },
        {
          question: "Online czy stacjonarnie?",
          answer:
            "Obie formy kosztują tyle samo. Online prowadzimy na tablicy, na której widać cały tok rozwiązania, a zapis zostaje u ucznia. Stacjonarnie — u nauczyciela albo z dojazdem, jeśli mieścisz się w zasięgu.",
          category: "Zajęcia",
          order: 2,
        },
        {
          question: "Kiedy najpóźniej mogę odwołać lekcję?",
          answer:
            "Do 12 godzin przed terminem, bez żadnych kosztów. Później termin przepada, bo zwykle nie da się już wstawić w to miejsce nikogo innego.",
          category: "Rezerwacje",
          order: 3,
        },
        {
          question: "Czym różnią się zajęcia grupowe od indywidualnych?",
          answer:
            "Grupa ma stały termin w tygodniu, 4–8 osób i rozliczenie miesięczne — wychodzi taniej, ale tempo jest wspólne. Zajęcia indywidualne idą dokładnie tam, gdzie potrzebuje uczeń.",
          category: "Zajęcia",
          order: 4,
        },
        {
          question: "Jak płacę za zajęcia?",
          answer:
            "Po lekcji: gotówką albo przelewem. Zajęcia grupowe rozliczamy z góry za miesiąc, niezależnie od tego, ile spotkań wypada w kalendarzu.",
          category: "Płatności",
          order: 5,
        },
        {
          question: "Czy uczeń musi mieć konto?",
          answer:
            "Nie. Termin można umówić bez zakładania konta — konto przydaje się tylko wtedy, gdy chcesz mieć historię lekcji w jednym miejscu.",
          category: "Rezerwacje",
          order: 6,
        },
      ],
    })
  }

  if ((await prisma.navLink.count()) === 0) {
    const header = [
      { label: "Wolne terminy", href: "/terminy", order: 1 },
      { label: "Przedmioty", href: "/przedmioty", order: 2 },
      { label: "Nauczyciele", href: "/nauczyciele", order: 3 },
      { label: "Cennik", href: "/cennik", order: 4 },
      { label: "Grupy", href: "/grupy", order: 5 },
      { label: "Pytania", href: "/faq", order: 6 },
    ]
    const footer = [
      { label: "Wolne terminy", href: "/terminy", order: 1 },
      { label: "Przedmioty", href: "/przedmioty", order: 2 },
      { label: "Nauczyciele", href: "/nauczyciele", order: 3 },
      { label: "Cennik", href: "/cennik", order: 4 },
      { label: "Zajęcia grupowe", href: "/grupy", order: 5 },
      { label: "Opinie", href: "/opinie", order: 6 },
      { label: "Pytania", href: "/faq", order: 7 },
      { label: "Kontakt", href: "/kontakt", order: 8 },
    ]

    await prisma.navLink.createMany({
      data: [
        ...header.map((item) => ({ ...item, menu: "HEADER" as const })),
        ...footer.map((item) => ({ ...item, menu: "FOOTER" as const })),
      ],
    })
  }

  if ((await prisma.page.count()) === 0) {
    await prisma.page.createMany({
      data: [
        {
          slug: "regulamin",
          title: "Regulamin",
          status: "PUBLISHED",
          seoDescription:
            "Zasady rezerwacji, odwoływania i rozliczania zajęć.",
          content: [
            "## Zapisy na zajęcia",
            "",
            "Termin rezerwuje się przez formularz na stronie albo telefonicznie. Zgłoszenie czeka na potwierdzenie nauczyciela — dopiero potwierdzenie oznacza umówioną lekcję.",
            "",
            "## Odwoływanie",
            "",
            "Lekcję można odwołać najpóźniej **12 godzin przed** terminem, bez żadnych kosztów. Później termin przepada, bo zwykle nie da się wstawić w to miejsce nikogo innego.",
            "",
            "## Płatności",
            "",
            "Za zajęcia indywidualne płaci się po lekcji — gotówką albo przelewem. Zajęcia grupowe rozliczamy z góry za miesiąc, niezależnie od tego, ile spotkań wypada w kalendarzu.",
            "",
            "## Zajęcia grupowe",
            "",
            "Grupa ma stały termin w tygodniu i od 4 do 8 osób. Rezygnację zgłasza się do końca miesiąca poprzedzającego.",
            "",
            "> Ten regulamin jest wersją roboczą wstawioną razem z serwisem. Ostateczną treść ustala właściciel w panelu.",
          ].join("\n"),
        },
        {
          slug: "polityka-prywatnosci",
          title: "Polityka prywatności",
          status: "PUBLISHED",
          seoDescription:
            "Jakie dane zbieramy przy rezerwacji i po co ich potrzebujemy.",
          content: [
            "## Kto przetwarza dane",
            "",
            `Administratorem danych jest ${siteName}. Kontakt w sprawie danych: przez formularz kontaktowy na stronie.`,
            "",
            "## Jakie dane zbieramy",
            "",
            "- **Przy rezerwacji lekcji:** imię i nazwisko, telefon, opcjonalnie adres e-mail oraz treść wiadomości.",
            "- **Przy zapytaniu przez formularz:** imię, adres e-mail, opcjonalnie telefon i treść wiadomości.",
            "- **Przy zapisie do grupy:** imię i nazwisko, telefon, adres e-mail.",
            "",
            "## Po co",
            "",
            "Wyłącznie po to, żeby umówić i przeprowadzić zajęcia oraz odpowiedzieć na pytanie. Nie wysyłamy newslettera i nie przekazujemy danych dalej.",
            "",
            "## Czego nie zbieramy",
            "",
            "Nie zapisujemy adresu IP. Używamy go wyłącznie w pamięci, żeby ograniczyć liczbę zgłoszeń z jednego miejsca w krótkim czasie.",
            "",
            "## Twoje prawa",
            "",
            "Masz prawo wglądu w swoje dane, ich poprawienia i usunięcia. Wystarczy napisać przez formularz kontaktowy.",
            "",
            "> Ten dokument jest wersją roboczą wstawioną razem z serwisem. Ostateczną treść ustala właściciel w panelu.",
          ].join("\n"),
        },
        {
          slug: "o-nas",
          title: "O nas",
          status: "DRAFT",
          content: [
            "## Kim jesteśmy",
            "",
            "Tu wchodzi opis zespołu — kto uczy, od kiedy i dlaczego akurat tak.",
            "",
            "Strona jest szkicem: dopóki ma status **szkic**, nie widać jej na stronie publicznej.",
          ].join("\n"),
        },
      ],
    })
  }
}
