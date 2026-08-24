# Korki na patencie — plan projektu

Serwis-wizytówka korepetycji + dashboard z CMS-em, statystykami i rolami.
Bez płatności online w MVP (Stripe dopięty później do istniejącego modelu `Booking`).

Stack: Next.js 16 (App Router) · React 19 · Tailwind 4 + shadcn (base-mira) · Prisma 7 + PostgreSQL · Clerk · Recharts.
Język całej aplikacji (frontend + dashboard): **polski**.

---

## 1. Role i uprawnienia

Źródłem prawdy dla roli jest `publicMetadata.role` w Clerku; kopia trafia do tabeli `users`
(żeby dało się filtrować i joinować w SQL). Zmiana roli w dashboardzie zapisuje w obu miejscach.

| Rola | Zakres |
|---|---|
| `ADMIN` | wszystko: CMS, ustawienia, użytkownicy, wszyscy nauczyciele, wszystkie rezerwacje, statystyki |
| `TEACHER` | tylko swoje: kalendarz, dostępność, rezerwacje, swój profil i cennik, swoi uczniowie, swoje opinie (podgląd) |
| `STUDENT` | brak dostępu do `/dashboard` (redirect na `/`); front + własne konto (etap 3) |

Ochrona dwuwarstwowa:

1. `proxy.ts` (dawne `middleware.ts` — w Next 16 zmieniona nazwa) — szybki, optymistyczny redirect.
2. `lib/auth.ts` — autorytatywne `ensureDashboardPage()` / `ensureAdminPage()` / `requireAdmin()` / `requireTeacherAccess()`
   wołane w layoutach RSC i **w każdej server action**. Proxy nigdy nie jest jedyną bramką.

---

## 2. Model danych (Prisma)

### Ludzie

- **User** — `clerkId`, email, imię/nazwisko, avatar, telefon, `role`, timestampy.
- **TeacherProfile** — 1:1 z User. `slug`, nagłówek, bio, stawka bazowa, `slotMinutes` (domyślna długość lekcji),
  `bufferMinutes` (przerwa między lekcjami), doświadczenie, wykształcenie, `isPublished`, `isAcceptingStudents`,
  kolejność na liście, pola SEO.
- **StudentProfile** — opcjonalny (klasa/poziom, szkoła, notatki, kontakt do rodzica).

### Oferta

- **Subject** — przedmiot (Matematyka, Fizyka...): nazwa, slug, opis, kolor/ikona, `isActive`, kolejność, SEO
  oraz **`basePrice`** — cennik przedmiotu, czyli stawka obowiązująca domyślnie każdego nauczyciela.
- **Level** — poziom (Podstawówka, Liceum, Matura, Studia) jako tabela, nie enum — admin dodaje własne.
- **TeacherSubject** — kto czego uczy: `teacherProfileId` + `subjectId`, **`price`** nadpisujące cennik
  przedmiotu dla tego nauczyciela, powiązane poziomy (m-n do `Level`), notatka.
  Unikat na parze (nauczyciel, przedmiot).

**Skąd bierze się cena:** `TeacherSubject.price ?? Subject.basePrice` — liczy to `lib/pricing.ts`.
Cena jest atrybutem przedmiotu, ale każdy nauczyciel może mieć za ten przedmiot własną stawkę.
Rezerwacja zapisuje wynik w `Booking.price` jako migawkę, więc późniejsza zmiana cennika
nie przelicza wstecz umówionych lekcji.
- **Location** — gdzie: **należy do konkretnego nauczyciela** (`teacherProfileId`), typ
  (`ONLINE` / `TEACHER_PLACE` / `STUDENT_PLACE`), nazwa, adres, miasto, notatka, `isActive`.
  Każdy nauczyciel ma swój zestaw: własny adres, własny zasięg dojazdu, własny link do zajęć online.
  Nie ma wspólnego słownika lokalizacji.

### Dostępność — model hybrydowy (wybrany wariant "oba naraz")

- **AvailabilityRule** — cykliczna siatka tygodnia: `weekday` (1 = poniedziałek … 7 = niedziela, ISO), `startMin`/`endMin` (minuty od północy),
  `validFrom`/`validTo`, opcjonalna lokalizacja, `isActive`.
  Przykład: "wtorek 16:00–20:00, online, od września".
- **AvailabilityException** — nadpisania konkretnego dnia:
  - `BLOCK` — urlop / zajęte (bez godzin = cały dzień),
  - `EXTRA` — jednorazowe dodatkowe okienko (np. "sobota 10:00–12:00").

Wolne terminy **nie są materializowane w bazie** — liczone w locie:
`reguły tygodniowe + wyjątki EXTRA − wyjątki BLOCK − istniejące rezerwacje − bufory − lead time`.
Dzięki temu zmiana grafiku nie wymaga regenerowania tysięcy rekordów.
Cała logika w jednym miejscu: `lib/availability.ts`.

### Rezerwacje

- **Booking** — `reference` (krótki kod), uczeń (zalogowany `userId` **albo** dane gościa: imię/email/telefon),
  nauczyciel, przedmiot, poziom, lokalizacja + tryb, `startsAt`/`endsAt`, cena, `status`, wiadomość od ucznia,
  notatka wewnętrzna, powód odrzucenia/odwołania, `confirmedAt`.
  Statusy: `PENDING` → `CONFIRMED` / `REJECTED` → `COMPLETED` / `CANCELLED` / `NO_SHOW`.
  Indeks na (`teacherProfileId`, `startsAt`) — po tym liczona jest kolizja terminów.
- **Inquiry** — zapytanie z formularza kontaktowego (bez blokowania terminu): `NEW` / `IN_PROGRESS` / `CLOSED`.

### CMS i reszta

- **Page** (markdown + SEO + `DRAFT`/`PUBLISHED`), **NavLink** (menu HEADER/FOOTER, kolejność, zagnieżdżenie),
  **Faq**, **Review** (opinie z moderacją: `PENDING`/`APPROVED`/`REJECTED`, powiązane z nauczycielem lub przedmiotem),
  **SiteSettings** (singleton: nazwa, logo, kontakt, social, domyślne SEO, reguły rezerwacji —
  minimalne wyprzedzenie, maks. horyzont, auto-potwierdzanie), **Notification**, **PageView** (statystyki ruchu).

---

## 3. Struktura dashboardu

```
/dashboard                    Przegląd            ADMIN + TEACHER (dane zawężone do własnych)
/dashboard/statystyki         Statystyki          ADMIN
/dashboard/ruch               Ruch na stronie     ADMIN

/dashboard/kalendarz          Kalendarz lekcji    ADMIN (wszyscy) / TEACHER (swoje)
/dashboard/dostepnosc         Moja dostępność     ADMIN + TEACHER
/dashboard/rezerwacje         Rezerwacje          ADMIN + TEACHER
/dashboard/rezerwacje/[id]    Szczegóły + akcje

/dashboard/nauczyciele        Nauczyciele         ADMIN
/dashboard/nauczyciele/[id]   Profil + cennik     ADMIN
/dashboard/przedmioty         Przedmioty          ADMIN
/dashboard/poziomy            Poziomy             ADMIN
/dashboard/lokalizacje        Lokalizacje         ADMIN

/dashboard/uczniowie          Uczniowie           ADMIN (wszyscy) / TEACHER (swoi)
/dashboard/zapytania          Zapytania           ADMIN + TEACHER (swoje)
/dashboard/opinie             Opinie (moderacja)  ADMIN

/dashboard/strony             Strony CMS          ADMIN
/dashboard/nawigacja          Menu                ADMIN
/dashboard/faq                FAQ                 ADMIN
/dashboard/seo                SEO                 ADMIN

/dashboard/uzytkownicy        Użytkownicy i role  ADMIN
/dashboard/ustawienia         Ustawienia          ADMIN
/dashboard/status             Status systemu      ADMIN
```

Layout wzorowany na projekcie `ecommerce`: stały sidebar szerokości 16rem (mobile: drawer), grupy pozycji,
badge z licznikiem oczekujących rezerwacji, sticky `Header` z tytułem, odświeżaniem i przełącznikiem motywu,
`StatCard` na kafle, Recharts na wykresy.

---

## 4. Etapy

### Etap 1 — barebones dashboard ⟵ **zrobione (poza migracją bazy)**

1. Zależności: `@clerk/nextjs`, `prisma` + `@prisma/client` + `@prisma/adapter-pg`, `dotenv`, `recharts`, `date-fns`.
2. `prisma/schema.prisma` (pełny model z pkt. 2) + `prisma.config.ts` + pierwsza migracja.
3. `lib/prisma.ts`, `lib/auth.ts`, `lib/sync-user.ts`, formatery PL w `lib/format.ts`, etykiety w `lib/labels.ts`.
4. Clerk: `ClerkProvider` (lokalizacja `plPL`) w root layoucie, `proxy.ts`, strony `/sign-in` i `/sign-up`.
5. Shell dashboardu: layout + sidebar (filtrowany rolą) + header + `StatCard` + stany `loading`/`error`/`not-found`.
6. Strony z prawdziwymi danymi: **Przegląd** (kafle + wykres lekcji), **Rezerwacje** (lista + potwierdź/odrzuć),
   **Nauczyciele**, **Przedmioty**, **Uczniowie**, **Użytkownicy** (zmiana roli).
   Pozostałe pozycje z sidebara: strony-szkielety z nagłówkiem i informacją "w przygotowaniu".
7. `prisma/seed.ts` — dane demo (2 nauczycieli, przedmioty, poziomy, dostępność, kilka rezerwacji),
   żeby dashboard nie był pusty.
8. Nadanie sobie roli `ADMIN`.

**Czego NIE ma w etapie 1:** frontendu publicznego, pełnego CRUD-u wszystkich encji, wysyłki maili, płatności.

### Etap 2 — dokończenie dashboardu ⟵ **zrobione**

CMS wypadł z tego etapu — bez frontendu nie ma czego renderować, więc trafił do etapu 3.5.

1. ✅ **Dostępność** — `lib/availability.ts` (wyliczanie wolnych terminów), edytor siatki tygodnia,
   wyjątki (blokada / dodatkowe okienko), ustawienia lekcji, podgląd na 14 dni.
2. ✅ **Kalendarz lekcji** — siatka tygodnia z lekcjami na tle wolnych okienek, nawigacja po tygodniach,
   dla admina widok wszystkich nauczycieli naraz.
3. ✅ **Szczegóły rezerwacji** — pełna karta z historią statusów, notatką wewnętrzną i kompletem akcji
   (potwierdź, odrzuć, odwołaj, rozlicz, nieobecność, cofnij decyzję).
4. ✅ **CRUD oferty** — przedmioty z cennikiem, poziomy, lokalizacje per nauczyciel,
   profil nauczyciela z przypisaniem przedmiotów, stawek i poziomów.
5. ✅ **Uczniowie** — karta ucznia z historią lekcji, danymi opiekuna i notatkami.
6. ✅ **Zapytania** — filtry po statusie, przypisanie do nauczyciela, obsługa i zamykanie.
7. ✅ **Ustawienia serwisu** — dane kontaktowe, waluta, globalne reguły rezerwacji.
8. ✅ **Statystyki** — lekcje i przychód w czasie, rozkłady po przedmiotach, poziomach, trybie
   i nauczycielach, obłożenie najbliższych 4 tygodni.
9. ✅ **Status systemu** — realne sprawdzenie bazy i Clerka z czasem odpowiedzi.
10. ✅ **Powiadomienia** — model, strona i dwa zdarzenia, które dziś zachodzą
    (przypisanie zapytania, nadanie roli). Powiadomienia o rezerwacjach ruszą razem z zapisami.

**Poza zakresem do czasu frontendu:** ruch na stronie (tabela `PageView` zapełni się dopiero,
gdy będzie co mierzyć) oraz CMS.

### Etap 3 — frontend publiczny

Strona główna (reklama korepetycji), lista i profile nauczycieli, strony przedmiotów,
**wyszukiwarka terminów** (przedmiot + poziom + tryb → wolne godziny u konkretnych nauczycieli),
formularz rezerwacji i zapytania, opinie, FAQ, strony CMS, konto ucznia.

### Etap 3.5 — CMS

Strony (markdown + SEO), nawigacja, FAQ, moderacja opinii — czyli treści, które renderuje frontend z etapu 3.

### Etap 4 — powiadomienia i automatyzacja

Maile transakcyjne (potwierdzenie, przypomnienie 24 h przed lekcją, odwołanie), eksport do iCal/Google Calendar.

### Etap 5 — płatności

Stripe Checkout na rezerwację, opcja "płatność na miejscu", faktury/rachunki, raport przychodów.

---

## 5. Co jest potrzebne przed uruchomieniem

1. **Lokalny PostgreSQL** — baza `korki` i connection string w `.env`:
   `DATABASE_URL="postgresql://postgres:haslo@localhost:5432/korki"`
2. **Aplikacja w Clerku** (dashboard.clerk.com → nowa aplikacja) — klucze w `.env`:
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` i `CLERK_SECRET_KEY`.
