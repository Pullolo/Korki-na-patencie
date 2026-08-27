# Zaślepki do podmiany

Lista treści, która **wygląda na prawdziwą, ale nią nie jest**. Powstała przy
etapie 3: gdy dane przeniosły się z kodu do bazy, `sampleTag` przestał je
oznaczać na stronie — zaślepka w bazie wygląda dokładnie jak fakt.
`PRODUCT.md` zabrania podawania zmyślonych rzeczy jako dowodu, więc lista
musi być prowadzona osobno i skracana, a nie tylko czytana.

## Do podmiany przed pokazaniem serwisu komukolwiek

| Co | Gdzie | Skąd wziąć prawdziwe |
|---|---|---|
| Nauczyciele `Anna Kowalska` i `Piotr Nowak` — imiona, bio, doświadczenie, lokalizacje | `prisma/seed.ts`, tabela `teacher_profiles` | Panel → Nauczyciele |
| Opinie `Kasia W.` i `Michał Z.` | seed, tabela `reviews` | Uczeń wystawia je na `/konto/lekcje` po odbytej lekcji; publikuje admin w `/dashboard/opinie` |
| Uczniowie `Kasia`, `Michał`, `Ola` i ich rezerwacje | seed, tabele `users`, `bookings` | Prawdziwe zgłoszenia z formularza |
| Zapytania `Marta Lewandowska`, `Jakub Mazur` | seed, tabela `inquiries` | Formularz `/kontakt` |
| Telefon `+48 600 000 000`, e-mail `kontakt@korkinapatencie.pl`, adres | `SiteSettings` | Panel → Ustawienia |
| Regulamin i polityka prywatności — wersje robocze | tabela `pages` | Panel → Strony (obie mają na końcu adnotację, że są robocze) |
| Ikona marki (czapka absolwenta) | `components/front/layout/brand-mark.tsx` | Logo, gdy powstanie |
| Grafik dostępności (wtorki, czwartki, soboty) | seed, `availability_rules` | Panel → Moja dostępność |

## Prawdziwe — wolno pokazywać

- Cennik: 80 / 100 / 120 zł za godzinę zegarową według poziomu.
- Zajęcia grupowe: 250 zł (4 × 60 min) i 350 zł (4 × 90 min) miesięcznie, grupy 4–8 osób.
- Rabat 20% na grupę dla uczniów zajęć indywidualnych.
- Reguły rezerwacji: 12 h na odwołanie, 60 dni horyzontu, potwierdzanie ręczne.
- Przedmioty i poziomy nauczania.
- Pytania i odpowiedzi (6 wpisów przeniesionych z landingu do bazy).

## Czego nie ma i nie wolno udawać

- **Ocen zbiorczych w danych strukturalnych** (`AggregateRating`) — wejdą, gdy
  opinie przestaną pochodzić z seeda. Komentarz w `components/front/json-ld.tsx`.
- **Liczb w rodzaju „500 zadowolonych uczniów"** — nie ma ich nigdzie na stronie
  i nie mają się pojawić bez pokrycia.
- **Zdjęć nauczycieli** — do czasu decyzji o magazynie plików profile pokazują
  avatar z Clerka albo inicjały; jedno i drugie jest prawdą, a nie ilustracją.
