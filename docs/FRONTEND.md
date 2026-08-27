# Frontend publiczny — plan (etap 3 + 3.5)

Plan zamiany makiety (`app/page.tsx`) w prawdziwy frontend na danych z bazy.
Kontekst produktowy: `PRODUCT.md`. Model danych i etapy: `docs/PLAN.md`.
System wizualny strony publicznej: `DESIGN.md` — ten dokument go **nie zmienia**,
tylko wskazuje trzy miejsca, gdzie zapis trzeba będzie uzupełnić (sekcja 13).

Zakres ustalony z właścicielem 2026-08-26: rdzeń (landing, nauczyciele, przedmioty,
wyszukiwarka terminów, rezerwacja, kontakt) **plus** CMS z nawigacją, zajęcia grupowe
z zapisami, konto ucznia, opinie wystawiane przez uczniów i wszystkie pozostałe strony,
których nie da się złożyć w CMS-ie. Rezerwacja dostaje własną ścieżkę `/rezerwacja`.
Landing zostaje długi — kotwice plus podstrony z rozwinięciem.

---

## 0. Punkt wyjścia

**Co już działa:**

- Makieta `app/page.tsx` — jedna strona, 781 linii, cała treść na twardo.
- `components/front/`: `styles.ts` (klasy przycisków, kart, chipów, `sampleTag`),
  `doodles.tsx`, `slot-picker.tsx` (przykładowy grafik), `theme-toggle.tsx`.
- Tokeny `--front-*` w `app/globals.css`, oba motywy, powierzchnia `[data-surface="front"]`.
- Backend w komplecie: modele Prismy, `computeAvailability()`, `resolveHourlyPrice()`,
  `findScheduleConflicts()`, `groupMeetingsInRange()`, panel z etapów 1–2.

**Czego nie ma:**

- Żadnej publicznej trasy poza `/` (oraz `/sign-in`, `/sign-up`).
- Żadnej publicznej server action — wszystko w `lib/actions/*` zaczyna się od
  `requireAdmin()` / `requireTeacherAccess()` / `requireDashboardUser()`.
- Warstwy zapytań publicznych. Front musiałby dziś sam pamiętać o `isPublished`,
  `isActive` i `status: APPROVED` przy każdym zapytaniu.
- Walidacji wejścia od anonima, anty-spamu, zgód RODO.
- Plików SEO (`sitemap.ts`, `robots.ts`, OG), JSON-LD, `NEXT_PUBLIC_SITE_URL`.
- **Sześciu stron panelu, od których zależy treść frontu.** Dziś są zaślepkami
  („w przygotowaniu"): `strony`, `nawigacja`, `faq`, `opinie`, `seo`, `ruch`.
  Skoro CMS i opinie wchodzą do zakresu, te strony przestają być etapem 3.5
  i wchodzą razem z frontem — inaczej nie ma czym zapełnić `/[slug]` ani czego
  moderować po pierwszej wystawionej opinii.

**Jedno ustalenie techniczne, które rzutuje na całość:** root layout woła
`ensureUserSynced()` → `currentUser()`, więc **każda** strona jest dziś renderowana
per request i żadna nie da się prerenderować. Szczegóły i konsekwencje w sekcji 7.

---

## 1. Zasady frontu

1. **RSC domyślnie.** `"use client"` tylko tam, gdzie naprawdę jest stan: wybór terminu,
   formularze, filtry katalogu, akordeon FAQ, przełącznik motywu, beacon ruchu.
2. **Grafik nigdy z cache'a.** Wolne terminy liczymy per request. Cały sens produktu
   (`PRODUCT.md`, Positioning) to godzina, która jest naprawdę wolna.
3. **Cena tylko z `resolveHourlyPrice()`** — nigdy liczona ręcznie w komponencie,
   nawet „na szybko" w landingu. Widełki od–do przez `priceRange()`.
4. **Dane publiczne wyłącznie przez `lib/public/*`.** Komponent strony nie dotyka
   `prisma` bezpośrednio. Powód: filtry `isPublished` / `isActive` / `APPROVED`
   muszą mieszkać w jednym miejscu, bo pominięcie jednego z nich to wyciek treści.
5. **Nieopublikowane nie istnieje.** Filtr idzie do zapytania, nie do JSX-a.
6. **Każde wejście anonima walidowane po stronie serwera** — także wtedy, gdy
   formularz ma już walidację w przeglądarce.
7. **Zaślepki oznaczone.** Każda treść bez pokrycia w rzeczywistości dostaje
   `sampleTag` i wpis na listę w sekcji 12.
8. **Front nie dziedziczy tokenów panelu** (`DESIGN.md`, Sealed-Surface Rule).
   Bez `components/ui/*` na stronie publicznej.
9. **Mobile-first.** Uczeń z telefonu jest pierwszym czytelnikiem, nie wariantem.
10. **Każda trasa ma komplet:** `generateMetadata`, stan ładowania, stan pusty
    napisany po ludzku i obsłużone 404.

---

## 2. Sitemap

### Drzewo

```
/                              Landing (długi, kotwice do sekcji)
│
├── /terminy                   Wyszukiwarka terminów  ?przedmiot=&poziom=&tryb=&od=
├── /nauczyciele               Lista nauczycieli      ?przedmiot=&poziom=&tryb=
│   └── /nauczyciele/[slug]    Profil + grafik + opinie
├── /przedmioty                Lista przedmiotów
│   └── /przedmioty/[slug]     Przedmiot: poziomy, ceny, kto uczy, wolne terminy
├── /cennik                    Indywidualne + grupowe + zasady rezerwacji
├── /grupy                     Zajęcia grupowe
│   └── /grupy/[slug]          Karta grupy + zapis
├── /opinie                    Opinie (APPROVED)
├── /faq                       Pytania i odpowiedzi
├── /kontakt                   Formularz zapytania + dane kontaktowe
│
├── /rezerwacja                Rezerwacja: termin → dane → wysłanie
│   └── /rezerwacja/[kod]      Status zgłoszenia (Booking.reference)
├── /zapis/[kod]               Status zapisu do grupy
│
├── /konto                     Nadchodzące lekcje                    [zalogowany]
│   ├── /konto/lekcje          Historia + opinia po lekcji           [zalogowany]
│   ├── /konto/grupy           Moje grupy                            [zalogowany]
│   └── /konto/dane            Dane kontaktowe i profil ucznia       [zalogowany]
│
├── /sign-in, /sign-up         Clerk (przeniesione pod chrome frontu)
└── /[slug]                    Strony CMS — regulamin, polityka, o nas
```

### Tabela tras

| Ścieżka | Co pokazuje | Źródło danych | Dostęp | Render |
|---|---|---|---|---|
| `/` | Hero z wyborem terminu, przedmioty, jak to działa, nauczyciele, cennik, opinie, FAQ, kontakt | `Subject`, `Level`, `PriceRule`, `TeacherProfile`, `Review`, `Faq`, `SiteSettings` + dostępność | publiczny | dynamiczny; katalog z cache'a, grafik świeży |
| `/terminy` | Wyszukiwarka: przedmiot + poziom + tryb → wolne godziny u konkretnych nauczycieli, 14 dni | `searchSlots()` | publiczny | dynamiczny, bez cache'a |
| `/nauczyciele` | Lista opublikowanych profili z filtrami | `TeacherProfile` (`isPublished`) + `TeacherSubject` | publiczny | katalog z cache'a |
| `/nauczyciele/[slug]` | Bio, przedmioty i poziomy, ceny, lokalizacje, grafik 14 dni, opinie | jw. + `Location`, `PriceRule`, `Review`, dostępność | publiczny | mieszany |
| `/przedmioty` | Wszystkie aktywne przedmioty | `Subject` (`isActive`) | publiczny | z cache'a |
| `/przedmioty/[slug]` | Opis, poziomy, widełki cen, kto uczy, najbliższe wolne godziny, FAQ przedmiotowe | `Subject`, `TeacherSubject`, `PriceRule`, `Faq`, dostępność | publiczny | mieszany |
| `/cennik` | Trzy poziomy indywidualne, grupy, rabat 20%, reguły rezerwacji | `PriceRule`, `CourseGroup`, `SiteSettings` | publiczny | z cache'a |
| `/grupy` | Oferta grup z liczbą wolnych miejsc | `CourseGroup` (`isPublished`, `isActive`) + `GroupEnrollment` | publiczny | dynamiczny (miejsca) |
| `/grupy/[slug]` | Termin, program, cena, miejsca, formularz zapisu | jw. | publiczny | dynamiczny |
| `/opinie` | Zatwierdzone opinie, filtr po nauczycielu i przedmiocie | `Review` (`APPROVED`) | publiczny | z cache'a |
| `/faq` | Pytania pogrupowane po `category` | `Faq` (`isPublished`) | publiczny | z cache'a |
| `/kontakt` | Formularz zapytania, dane kontaktowe, mapa/miasto | `SiteSettings`, `Subject`, `Level`, `TeacherProfile` | publiczny | z cache'a + akcja |
| `/rezerwacja` | Krok 1 termin (z parametrów), krok 2 dane, wysłanie | dostępność + `resolveHourlyPrice()` | publiczny | bez cache'a |
| `/rezerwacja/[kod]` | Status zgłoszenia, szczegóły, odwołanie | `Booking` po `reference` | publiczny (kod = klucz) | bez cache'a |
| `/zapis/[kod]` | Potwierdzenie zapisu / miejsce na liście rezerwowej | `GroupEnrollment` | publiczny (kod) | bez cache'a |
| `/konto` | Nadchodzące lekcje, skróty | `Booking` ucznia | zalogowany | bez cache'a |
| `/konto/lekcje` | Historia, odwołanie, „wystaw opinię" po `COMPLETED` | `Booking`, `Review` | zalogowany | bez cache'a |
| `/konto/grupy` | Aktywne i archiwalne zapisy | `GroupEnrollment` | zalogowany | bez cache'a |
| `/konto/dane` | Dane kontaktowe, poziom, opiekun | `User`, `StudentProfile` | zalogowany | bez cache'a |
| `/[slug]` | Strona CMS (markdown) | `Page` (`PUBLISHED`) | publiczny | z cache'a |

### Trasy techniczne

| Plik | Rola |
|---|---|
| `app/sitemap.ts` | mapa witryny ze wszystkich publicznych tras + slugi z bazy; honoruje `Page.noIndex` |
| `app/robots.ts` | `Disallow: /dashboard`, `/konto`, `/rezerwacja/`, `/zapis/`; całość zablokowana przy `SiteSettings.noIndexSite` |
| `app/(front)/opengraph-image.tsx` | domyślny obraz OG; warianty per nauczyciel i przedmiot |
| `app/manifest.ts` | opcjonalnie, dla „dodaj do ekranu głównego" |
| `app/api/ruch/route.ts` | odbiór `PageView` (sekcja 10) |
| `app/(front)/not-found.tsx`, `error.tsx`, `loading.tsx` | stany frontu w jego własnym języku wizualnym |

### Slugi zarezerwowane

`/[slug]` na poziomie roota łapie wszystko, co nie pasuje do trasy statycznej.
Next rozstrzyga segmenty statyczne przed dynamicznymi, więc kolizji w runtime nie ma,
ale admin może w CMS-ie założyć stronę o slugu `cennik` i ta strona **nigdy się nie
otworzy** — bez żadnego błędu. Dlatego edytor stron (M6) waliduje slug wobec listy:

```
terminy · nauczyciele · przedmioty · cennik · grupy · opinie · faq · kontakt
rezerwacja · zapis · konto · dashboard · sign-in · sign-up · api
sitemap.xml · robots.txt · manifest.webmanifest
```

Lista mieszka w `lib/public/reserved-slugs.ts` i jest importowana i przez walidację
w panelu, i przez `app/sitemap.ts`.

---

## 3. Przepływy

**1. Uczeń, telefon, wieczór przed sprawdzianem.** Landing → hero pokazuje wolne
godziny bez żadnego kliknięcia (domyślnie pierwszy przedmiot, najbliższe 5 dni) →
wybiera godzinę → `/rezerwacja?nauczyciel=…&przedmiot=…&poziom=…&termin=…` →
dane (imię, telefon, opcjonalnie mail) → wysyła → `/rezerwacja/[kod]` ze statusem
„czeka na potwierdzenie". Konto niepotrzebne. Trzy ekrany od wejścia do zgłoszenia.

**2. Rodzic, laptop, później tego samego wieczoru.** Wchodzi z linku od dziecka albo
z wyszukiwarki → `/cennik` (cena jawna, bez formularza) → `/nauczyciele/[slug]`
(kto uczy, doświadczenie, opinie) → albo `/kontakt` (pytanie bez blokowania terminu),
albo `/rezerwacja`. Ta ścieżka nie może wymagać przejścia przez landing.

**3. Zapis do grupy.** `/grupy` → karta grupy z terminem i liczbą wolnych miejsc →
formularz → `enrollPublic()` liczy rabat (20% dla uczniów zajęć indywidualnych)
i sadza na liście rezerwowej, gdy brak miejsc → `/zapis/[kod]`.

**4. Uczeń wraca.** `/konto` → nadchodzące lekcje → odwołanie (z zachowaniem
`minLeadHours`) albo, po lekcji `COMPLETED`, „wystaw opinię" → `Review` w stanie
`PENDING` → moderacja w panelu.

**5. Ślepe uliczki — muszą być zaprojektowane, nie „obsłużone".**

- Brak wolnych terminów w przedmiocie → nie pusty ekran, tylko najbliższy wolny
  termin u kogokolwiek + wejście w `/kontakt` z podpiętym przedmiotem.
- Ktoś zajął slot między wyborem a wysłaniem → `findScheduleConflicts()` odrzuca,
  a formularz wraca z aktualną listą godzin tego dnia, nie z samym błędem.
- Termin poza `minLeadHours` / `maxAdvanceDays` → godzina w ogóle się nie pojawia
  (to już robi `computeAvailability()`), ale akcja i tak sprawdza to ponownie.
- Dzień bez godzin zostaje na siatce jako kafelek przekreślony (`DESIGN.md`).

---

## 4. Struktura katalogów

```
app/
├── layout.tsx                    ← zostaje jedynym root layoutem
├── sitemap.ts, robots.ts
├── api/ruch/route.ts
├── dashboard/**                  ← bez zmian
└── (front)/
    ├── layout.tsx                ← fonty, data-surface, header, footer, beacon
    ├── page.tsx                  ← landing (dziś app/page.tsx)
    ├── not-found.tsx, error.tsx, loading.tsx
    ├── opengraph-image.tsx
    ├── terminy/page.tsx
    ├── nauczyciele/page.tsx, [slug]/page.tsx
    ├── przedmioty/page.tsx, [slug]/page.tsx
    ├── cennik/page.tsx
    ├── grupy/page.tsx, [slug]/page.tsx
    ├── opinie/page.tsx
    ├── faq/page.tsx
    ├── kontakt/page.tsx
    ├── rezerwacja/page.tsx, [kod]/page.tsx
    ├── zapis/[kod]/page.tsx
    ├── konto/layout.tsx, page.tsx, lekcje/, grupy/, dane/
    ├── sign-in/[[...sign-in]]/page.tsx     ← przeniesione, URL bez zmian
    ├── sign-up/[[...sign-up]]/page.tsx     ← przeniesione
    └── [slug]/page.tsx           ← CMS, ostatni w kolejności rozstrzygania

components/front/
├── styles.ts, doodles.tsx, theme-toggle.tsx        ← są
├── slot-picker.tsx                                  ← przepisany na dane z serwera
├── layout/  site-header.tsx, site-footer.tsx, nav-links.tsx, page-hero.tsx
├── sections/ subjects.tsx, steps.tsx, teachers.tsx, pricing.tsx, reviews.tsx, faq.tsx, cta.tsx
├── booking/ booking-form.tsx, slot-grid.tsx, booking-summary.tsx, booking-status.tsx
├── catalog/ teacher-card.tsx, subject-card.tsx, filter-bar.tsx, group-card.tsx
├── forms/   field.tsx, form-error.tsx, consent.tsx, honeypot.tsx, submit-button.tsx
└── markdown.tsx                                     ← renderer treści CMS

lib/
├── public/                       ← zapytania czytające (sekcja 5)
├── actions/public/               ← akcje anonima (sekcja 6)
└── seo.ts, tags.ts, reserved-slugs.ts
```

Grupa `(front)` nie zmienia żadnego URL-a i nie rusza panelu. Nie tworzymy drugiego
root layoutu — pełne przeładowanie przy przejściu front ↔ panel nie jest nam do
niczego potrzebne, a `data-surface="front"` na kontenerze grupy już dziś wystarcza,
żeby oba światy się nie mieszały.

Fonty `Fredoka` i `Nunito` przenoszą się z `app/page.tsx` do `app/(front)/layout.tsx` —
inaczej każda nowa podstrona musiałaby je ładować u siebie.

---

## 5. Warstwa danych — `lib/public/*`

Moduły czytające, wołane wyłącznie z RSC. Każdy sam pilnuje filtrów widoczności.

| Moduł | Funkcje | Pilnuje |
|---|---|---|
| `settings.ts` | `getSiteSettings()` | singleton, wartości domyślne gdy brak wiersza |
| `nav.ts` | `getNav("HEADER")`, `getNav("FOOTER")` | `isActive`, kolejność, zagnieżdżenie |
| `subjects.ts` | `listSubjects()`, `getSubject(slug)` | `isActive`, `order` |
| `levels.ts` | `listLevels()` | `isActive`, `order` |
| `teachers.ts` | `listTeachers(filter)`, `getTeacher(slug)` | `isPublished`, `order`, `isAcceptingStudents` jako sygnał, nie filtr |
| `pricing.ts` | `getPriceTable()`, `priceFor({level, subject, teacher})` | opakowuje `resolveHourlyPrice()` / `priceRange()` |
| `availability.ts` | `getTeacherDays(teacherId, opts)`, `searchSlots(query)` | lead time, horyzont, grupy, bufory |
| `groups.ts` | `listGroups()`, `getGroup(slug)`, `seatsLeft(group)` | `isPublished` + `isActive`, liczy `ACTIVE` |
| `reviews.ts` | `listReviews({teacher, subject, limit})` | tylko `APPROVED` |
| `faq.ts` | `listFaq(category?)` | `isPublished` |
| `pages.ts` | `getPage(slug)`, `listPageSlugs()` | tylko `PUBLISHED` |
| `bookings.ts` | `getBookingByReference(kod)`, `listMyBookings(userId)` | kod jako klucz dostępu |

### `searchSlots()` — sedno wyszukiwarki

Wejście: `{ subjectId?, levelId?, mode?, from, days }`.
Wyjście: dni → sloty, każdy slot z nauczycielem, lokalizacją i ceną.

Algorytm:

1. Wybierz nauczycieli: `isPublished` + (jeśli podano przedmiot) `TeacherSubject`
   z tym `subjectId`, a przy podanym poziomie — z tym poziomem na liście.
2. **Jednym zapytaniem na typ**, nie w pętli po nauczycielach: reguły, wyjątki,
   rezerwacje `PENDING`/`CONFIRMED` w oknie, aktywne grupy. Pogrupuj w pamięci
   po `teacherProfileId`.
3. Rozwiń grupy przez `groupMeetingsInRange()` i dorzuć do `busy`.
4. Dla każdego nauczyciela `computeAvailability()` z jego `slotMinutes`,
   `bufferMinutes`, `minLeadHours`, `maxAdvanceDays`. Globalne reguły z
   `SiteSettings` są dolną granicą — nauczyciel może je u siebie tylko zawęzić.
5. Scal po dniach, posortuj po godzinie, przy równych godzinach zachowaj `order`
   nauczyciela. Cena z `priceFor()` — poziom bije przedmiot bije nauczyciela.

Przy obecnej skali (kilku nauczycieli, 14 dni) to jedno przejście po kilkuset
rekordach. Punkt 2 jest ważny mimo to: pętla `await` po nauczycielach zamienia
jedną stronę w kilkanaście round-tripów do bazy i psuje TTFB tam, gdzie boli
najbardziej — w pierwszym widoku na telefonie.

---

## 6. Akcje publiczne — `lib/actions/public/*`

Osobny katalog, bo różnią się od panelowych wszystkim: nie mają zalogowanego
użytkownika, przyjmują wejście od nieznajomego i nie mogą ufać niczemu.

| Akcja | Co robi | Zabezpieczenia |
|---|---|---|
| `requestBooking(input)` | Tworzy `Booking` `PENDING` (gość albo zalogowany), cena z `resolveHourlyPrice()`, powiadomienie dla nauczyciela | walidacja, `findScheduleConflicts()` **ponownie**, lead time i horyzont, limit zgłoszeń, honeypot |
| `cancelOwnBooking(ref \| id)` | Odwołanie przez ucznia, `CANCELLED` + powód | właściciel po `userId` albo po kodzie; blokada poniżej `minLeadHours` |
| `submitInquiry(input)` | `Inquiry` `NEW` + powiadomienie | walidacja, limit, honeypot, zgoda |
| `enrollPublic(groupId, input)` | Opakowuje logikę `enrollInGroup()` bez wymogu roli: rabat, lista rezerwowa | walidacja, sprawdzenie `isPublished`, limit miejsc liczony w transakcji |
| `submitReview(input)` | `Review` `PENDING` powiązana z `Booking` | tylko zalogowany, tylko własna lekcja `COMPLETED`, jedna opinia na lekcję (`bookingId` jest `@unique`) |
| `updateOwnProfile(input)` | Dane kontaktowe i `StudentProfile` | tylko zalogowany, tylko własny wiersz |

**Uwaga do `enrollInGroup()`:** dzisiejsza wersja w `lib/actions/groups.ts` jest pisana
pod panel i zaczyna od autoryzacji. Nie kopiujemy jej — wspólną część (rabat, limit,
lista rezerwowa) wyciągamy do `lib/enrollment.ts`, a obie akcje robią wokół niej
własną bramkę. Inaczej reguła rabatu zacznie żyć w dwóch miejscach.

**Wspólny szkielet każdej akcji publicznej:**

1. Walidacja schematem → błędy zwracane per pole, po polsku.
2. Honeypot (pole ukryte, wypełnione = cicho udajemy sukces) + minimalny czas
   wypełnienia formularza (znacznik czasu podpisany przy renderze).
3. Limit: liczba rekordów z tego adresu IP i z tego maila w ostatniej godzinie,
   liczona zapytaniem do bazy. Bez Redisa — przy tej skali wystarczy, a przy
   wielu instancjach jest to jedyny licznik, który się nie rozjedzie.
4. Sprawdzenia dziedzinowe (kolizja, miejsca, lead time).
5. Zapis + `Notification` dla nauczyciela/admina + `revalidateTag()` (sekcja 7).
6. Zwrot: `{ ok: true, kod }` albo `{ ok: false, errors }`. **Nie** rzucamy wyjątkiem —
   panelowy `useServerAction()` łapie wyjątki i pokazuje jeden komunikat, a formularz
   publiczny musi umieć podświetlić konkretne pole. Front dostaje własny
   `useFormAction()` obok istniejącego hooka, nie zamiast niego.

**Dane osobowe.** Formularze zbierają imię, telefon i mail — to dane osobowe.
Potrzebne są zatem: strona polityki prywatności (CMS, ale slug zarezerwowany
i podlinkowany w stopce), pole zgody przy każdym formularzu z linkiem do niej,
oraz zasada minimalizacji: adresu IP używamy do liczenia limitu i nie zapisujemy
go w żadnej tabeli.

---

## 7. Render, cache i rewalidacja

**Stan zastany.** `app/layout.tsx` woła `ensureUserSynced()`, a to woła `currentUser()`.
Odczyt ciasteczek w root layoucie robi **każdą** trasę dynamiczną. Nic nie zostanie
prerenderowane, dopóki to się nie zmieni.

**Decyzja na etap 3 — opcja A: zostawiamy dynamiczne renderowanie.** Strony i tak
pokazują kalendarz, który nie może być stary, a katalog opakowujemy w cache po
stronie danych. Zero ryzyka regresji w panelu, zero pracy na starcie.

**Opcja B, do rozważenia po M9 (nie w tym etapie):** wyprowadzić `ensureUserSynced()`
z root layoutu do `app/dashboard/layout.tsx` i `app/(front)/konto/layout.tsx`,
a link „Panel" w nagłówku oprzeć na klienckim `Show`/`useUser` zamiast na
`currentUser()`. Wtedy landing, cennik, przedmioty i strony CMS dają się prerenderować.
To realna wygrana na TTFB w pierwszym widoku i jedyna rzecz, która dziś ją blokuje.

**Cache Components (`cacheComponents: true` + `use cache`) — nie teraz.** To przełącznik
na całą aplikację, zmienia model renderowania także w panelu i wymaga osobnego przejścia
(`node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`).
Do tego czasu obowiązuje model udokumentowany w `caching-without-cache-components.md`,
czyli `unstable_cache` z tagami.

**Co cache'ujemy** — `unstable_cache` w `lib/public/*`, tagi w `lib/tags.ts`:

| Tag | Obejmuje | Kto unieważnia |
|---|---|---|
| `katalog` | przedmioty, poziomy | `lib/actions/catalog.ts` |
| `nauczyciele` | profile, przypisania przedmiotów, lokalizacje | `teachers.ts`, `catalog.ts`, `users.ts` |
| `cennik` | reguły cenowe | `pricing.ts` |
| `grupy` | definicje grup (nie: liczba miejsc) | `groups.ts` |
| `opinie` | zatwierdzone opinie | moderacja (M7) |
| `cms` | strony, nawigacja, FAQ | M6 |
| `ustawienia` | `SiteSettings` | `settings.ts` |

Akcje panelu wołają dziś wyłącznie `revalidatePath("/dashboard/…")` — front by o zmianach
nie wiedział. Każda z nich dostaje dodatkowo `revalidateTag(tag, "max")`. Drugi argument
jest obowiązkowy: wywołanie bez niego jest w Next 16 wycofane.

**Czego nie cache'ujemy nigdy:** dostępności i wolnych terminów, liczby miejsc w grupie,
statusu rezerwacji, całego `/konto`.

---

## 8. Komponenty

**Zostaje bez zmian:** `styles.ts`, `doodles.tsx`, `theme-toggle.tsx`, tokeny `--front-*`,
animacja `front-slot-in`, reguły z `DESIGN.md`.

**Do przerobienia:**

- `app/page.tsx` → `app/(front)/page.tsx`. Osiem sekcji wyjeżdża do
  `components/front/sections/*` jako komponenty przyjmujące dane w propsach.
  Landing zostaje długi (decyzja właściciela), ale każda sekcja kończy się wejściem
  w podstronę: przedmioty → `/przedmioty`, nauczyciele → `/nauczyciele`,
  cennik → `/cennik`, opinie → `/opinie`, FAQ → `/faq`.
- Nagłówek i stopka → `components/front/layout/*`, czytają `NavLink` i `SiteSettings`
  zamiast stałej `NAV`. Do czasu M6 fallback na dzisiejszą listę kotwic.
- `slot-picker.tsx` → dane z serwera zamiast stałej `SUBJECTS`. Model interakcji:
  **przedmiot → dzień → godzina**, a nauczyciel jest wynikiem, nie kolejnym wyborem —
  na kafelku godziny widać, u kogo jest wolne. Hero pokazuje 5 dni, `/terminy` czternaście;
  to ten sam komponent z inną liczbą dni i widocznymi filtrami.

**Nowe:** `booking/*` (formularz, siatka slotów, podsumowanie, status),
`catalog/*` (karty, pasek filtrów), `forms/*` (pole, błąd, zgoda, honeypot,
przycisk z „w toku"), `markdown.tsx`, `page-hero.tsx` — wspólny nagłówek podstron,
żeby dziewięć stron nie wymyśliło dziewięciu wariantów tego samego.

**Dwie rzeczy do rozstrzygnięcia w `DESIGN.md` przy okazji M1** (dziś zapis ich nie
przewiduje, bo powstał dla makiety):

1. Siatka dni w wyborze terminu jest opisana jako „stały tydzień roboczy",
   `grid-cols-5`. Prawdziwy grafik ma wyjątki `EXTRA` także w soboty. Proponowane:
   pięć kafelków **przesuwanego okna od dziś**, nie poniedziałek–piątek.
2. Nowe stany, których makieta nie miała: kafelek godziny „zajęte w trakcie wypełniania",
   pole formularza z błędem, pusta lista po filtrach. Wszystkie trzy trzeba dopisać
   do słownika komponentów.
3. `--front-coral` jest w zapisie „zarezerwowany, dziś nieużywany, czeka na czwartą
   kategorię". Kandydat: status rezerwacji (odrzucona / odwołana) na `/rezerwacja/[kod]`.

---

## 9. SEO

- `generateMetadata` na każdej trasie. Kolejność źródeł: `seoTitle`/`seoDescription`
  encji → `SiteSettings` → wartości domyślne z root layoutu.
- `NEXT_PUBLIC_SITE_URL` do `.env.example` i `metadataBase` w root layoucie —
  bez tego OG i canonical wychodzą ze ścieżkami względnymi.
- `app/sitemap.ts`: trasy statyczne + slugi nauczycieli, przedmiotów, grup i stron CMS.
  `Page.noIndex` wypada, `SiteSettings.noIndexSite` wyłącza całość.
- `app/robots.ts`: `Disallow` na `/dashboard`, `/konto`, `/rezerwacja/`, `/zapis/`, `/api`.
- JSON-LD (`next/script`, `type="application/ld+json"`, przewodnik `guides/json-ld.md`):
  `LocalBusiness` w layoucie, `Person` na profilu nauczyciela, `Course` na grupie
  i przedmiocie, `FAQPage` na `/faq`, `BreadcrumbList` na podstronach.
  **Bez `AggregateRating`, dopóki opinie są zaślepkami** — `PRODUCT.md` zakazuje
  podawania zmyślonych ocen jako faktu, a schema.org to właśnie deklaracja faktu.
- OG: `opengraph-image.tsx` z `ImageResponse`, warianty dla nauczyciela i przedmiotu.
- Avatary z Clerka wymagają `images.remotePatterns` dla `img.clerk.com`
  w `next.config.ts` — dziś konfiguracja jest pusta i `next/image` odrzuci te adresy.

---

## 10. Ruch na stronie

`PageView` czeka pusta od etapu 2. Najprostsze wypełnienie: mały komponent kliencki
w layoucie frontu wysyła `navigator.sendBeacon` na `POST /api/ruch` przy każdej zmianie
ścieżki.

Zapisujemy: `path`, `referrer` (sam host, bez ścieżki i parametrów), `sessionId`
z `sessionStorage`, `device` z User-Agenta, `country` z nagłówka geolokalizacji.
Nie zapisujemy adresu IP. Pomijamy `/dashboard`, `/api` i ruch z oczywistych botów.

To odblokowuje `/dashboard/ruch`, dziś zaślepkę. Zewnętrzna analityka (Plausible,
Vercel Analytics) zostaje decyzją otwartą — własna tabela wystarcza na start i nie
dokłada zgód na ciasteczka.

---

## 11. Dostępność i mobile

- Układ mobilny projektowany pierwszy; cele dotykowe co najmniej 44 px.
  Kafelki godzin z `DESIGN.md` (promień 12 px) muszą to spełnić — do sprawdzenia w M1.
- Nawigacja główna pojawia się od `lg`; poniżej potrzebne jest menu mobilne, bo
  podstron będzie kilkanaście, a nie same kotwice. Dziś makieta nie ma go wcale.
- Wybór terminu: kafelki dni i godzin jako `radiogroup` z obsługą strzałek,
  `aria-pressed` na wybranym, dzień bez godzin `aria-disabled` z czytelnym powodem.
- Formularze: `<label>` przy każdym polu, błędy przez `aria-describedby`,
  komunikat wyniku w `aria-live="polite"`.
- `:focus-visible`, `prefers-reduced-motion` i `color-scheme` są już ustawione pod
  `[data-surface="front"]` — nowe komponenty mają z tego korzystać, nie definiować od nowa.
- Kontrast był domknięty przy redesignie landingu; każdy nowy kolor tekstu na tle
  przechodzi to samo sprawdzenie.

---

## 12. Kolejność prac

Każdy krok kończy się czymś, co da się otworzyć w przeglądarce.

| # | Zakres | Gotowe, gdy |
|---|---|---|
| **M0** | Grupa `(front)`, layout z fontami i `data-surface`, nagłówek/stopka jako komponenty, `not-found`/`error`/`loading`, przeniesienie `sign-in`/`sign-up`, `NEXT_PUBLIC_SITE_URL`, `metadataBase`, `images.remotePatterns`, biblioteka walidacji, `lib/tags.ts` | landing wygląda identycznie jak dziś, ale stoi w nowej strukturze |
| **M1** | `lib/public/*`, landing na danych z bazy, `SlotPicker` na `computeAvailability()` | żadnej stałej z treścią w `app/(front)/page.tsx`; godziny w hero są prawdziwe |
| **M2** | `/nauczyciele`, `/nauczyciele/[slug]`, `/przedmioty`, `/przedmioty/[slug]`, `/cennik` | katalog kompletny, ceny wyłącznie z `PriceRule` |
| **M3** | `/terminy`, `/rezerwacja`, `/rezerwacja/[kod]`, `requestBooking()`, powiadomienia | zgłoszenie z frontu ląduje w `/dashboard/rezerwacje` i da się je potwierdzić |
| **M4** | `/kontakt`, `submitInquiry()`, `/faq` | zapytanie ląduje w `/dashboard/zapytania` |
| **M5** | `/grupy`, `/grupy/[slug]`, `enrollPublic()`, `/zapis/[kod]`, wspólne `lib/enrollment.ts` | zapis z rabatem i listą rezerwową działa z obu stron |
| **M6** | Panel: `strony`, `nawigacja`, `faq`, `seo`. Front: `/[slug]`, nawigacja z bazy, renderer markdown, zarezerwowane slugi | regulamin i polityka prywatności powstają w panelu, nie w kodzie |
| **M7** | `submitReview()`, `/opinie`, moderacja w `/dashboard/opinie` | pierwsza prawdziwa opinia przechodzi drogę: uczeń → moderacja → strona |
| **M8** | `/konto/*`, `ensureAccountPage()` w `lib/auth.ts`, `cancelOwnBooking()`, `updateOwnProfile()` | uczeń widzi swoje lekcje i odwołuje je sam |
| **M9** | `sitemap.ts`, `robots.ts`, OG, JSON-LD, `PageView` + `/dashboard/ruch` | mapa witryny zawiera slugi z bazy, wykres ruchu pokazuje realne wejścia |
| **M10** | Przegląd dostępności, Lighthouse na telefonie, aktualizacja `DESIGN.md` o nowe komponenty i stany, lista zaślepek do podmiany | zapis zgadza się z kodem |

M0–M3 to minimum, po którym serwis realizuje obietnicę z `PRODUCT.md`
(„potrzebuję pomocy → mam umówioną lekcję"). Reszta ją poszerza.

---

## 13. Zaślepki do podmiany

`PRODUCT.md`: na dziś **nie ma żadnych prawdziwych dowodów**. Po M1 zaślepki przenoszą
się z kodu do bazy — to je ukrywa, więc lista musi być prowadzona osobno:

- Nauczyciele: `Anna Kowalska`, `Piotr Nowak` z `prisma/seed.ts` wraz z bio,
  doświadczeniem i wykształceniem.
- Opinie: wszystkie wiersze `Review` z seeda.
- Kontakt: telefon, e-mail, adres i miasto w `SiteSettings`.
- Ikona marki (czapka absolwenta) — zaślepka z etapu 1.
- Liczby w hero i sekcjach, jeśli jakiekolwiek dojdą.

Prawdziwe i wolno je pokazywać: cennik (80/100/120 zł/h), format i ceny grup
(250 / 350 zł mies.), rabat 20%, reguły rezerwacji (12 h, 60 dni, potwierdzanie ręczne),
przedmioty i poziomy. Wszystko inne dostaje `sampleTag`.

---

## 14. Decyzje

**Podjęte:**

- Pełny zakres: rdzeń + CMS z nawigacją + grupy z zapisami + konto ucznia + opinie.
- Rezerwacja na własnej ścieżce `/rezerwacja`, ze stanem w URL-u i statusem pod kodem.
- Landing zostaje długi; podstrony rozwijają sekcje, nie zastępują ich.
- Etap 3.5 (CMS) wchodzi razem z etapem 3 — sześć stron panelu przestaje być zaślepkami.
- Rezerwacja bez konta zostaje możliwa; konto nie jest bramką (`PRODUCT.md`).
- Cache Components odłożone; do tego czasu `unstable_cache` z tagami.
- Adresu IP nie zapisujemy — służy tylko do liczenia limitu zgłoszeń.

**Otwarte — do rozstrzygnięcia zanim ruszy odpowiedni krok:**

| Decyzja | Kiedy | Rekomendacja |
|---|---|---|
| Biblioteka walidacji: `zod` czy ręczne walidatory | M0 | `zod` — wejście od anonima w sześciu akcjach, ręczne walidatory rozjadą się z komunikatami |
| Renderer markdown dla CMS | M6 | `react-markdown` + `remark-gfm` + sanityzacja; MDX to za dużo władzy dla treści z panelu |
| Zdjęcia nauczycieli | M2 | na razie avatar z Clerka; własny upload to osobna decyzja o magazynie plików |
| Miasto i mapa na `/kontakt` | M4 | najpierw prawdziwy adres w `SiteSettings`, mapa dopiero potem |
| Zewnętrzna analityka obok `PageView` | M9 | odłożyć — własna tabela wystarcza i nie dokłada zgód |
| Domena produkcyjna i `NEXT_PUBLIC_SITE_URL` | M0 | potrzebna wartość, choćby tymczasowa — bez niej OG i sitemap są bezużyteczne |
| Wystawianie opinii przez gościa (bez konta) | M7 | odłożyć do etapu 4 — sensowne dopiero z linkiem w mailu po lekcji |
