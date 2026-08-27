<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Korki na patencie

Serwis korepetycji: publiczna wizytówka + panel z CMS-em i rolami. Plan i model
danych: `docs/PLAN.md`.

## Zasady projektu

- Cała aplikacja jest po polsku — teksty UI, komunikaty błędów, etykiety statusów.
  Ścieżki w `/dashboard` też są polskie (`/dashboard/rezerwacje`, `/dashboard/uzytkownicy`).
- Role: `ADMIN`, `TEACHER`, `STUDENT`. Źródłem prawdy jest `publicMetadata.role`
  w Clerku, kopia leży w tabeli `users`.
- `TeacherProfile` nie wynika z roli. Rola `TEACHER` zakłada profil automatycznie,
  a admin może go sobie nadać (albo nie) przez `setTeacherProfile()` w
  `/dashboard/uzytkownicy`. Pytaj więc o `ctx.teacherProfileId`, nie o rolę,
  kiedy chodzi o „czy ta osoba prowadzi zajęcia".
- Autoryzacja: `proxy.ts` robi tylko optymistyczny redirect. Prawdziwą bramką są
  `ensureDashboardPage()` / `ensureAdminPage()` z `lib/auth.ts` w RSC oraz
  `requireDashboardUser()` / `requireAdmin()` / `requireTeacherAccess()` w każdej
  server action. Nigdy nie polegaj wyłącznie na proxy.
- Zapytania nauczyciela zawężaj przez `teacherScope(ctx)` — admin widzi wszystko,
  nauczyciel tylko własny profil.
- Godziny dostępności trzymamy jako minuty od północy (`startMin`, `endMin`),
  dni tygodnia w konwencji ISO (1 = poniedziałek).
- Cena godziny wynika z tabeli `PriceRule` (poziom / przedmiot / nauczyciel, wszystkie opcjonalne).
  Nigdy nie licz jej ręcznie — wołaj `resolveHourlyPrice()` z `lib/pricing.ts`, które wybiera
  najbardziej szczegółową pasującą regułę. `Booking.price` to migawka z chwili zapisu.
- Zajęcia grupowe (`CourseGroup`) rozliczają się miesięcznie, mają stały termin w tygodniu
  i blokują godziny w grafiku przez `groupMeetingsInRange()`. Rabat dla uczniów zajęć
  indywidualnych nalicza `enrollInGroup()` i zapisuje jako migawkę w `GroupEnrollment`.
- Lokalizacje należą do nauczyciela (`Location.teacherProfileId`), nie ma wspólnego słownika.
- Klucze miesięcy buduj z lokalnych składowych daty, nie przez `toISOString()` — offset strefy
  przenosi początek miesiąca do poprzedniego.
- Zmienne środowiskowe są w `.env.local` (wzór: `.env.example`).
  Prisma czyta je przez `prisma.config.ts`.
- Komponenty `ui/` to shadcn na Base UI — podmiana elementu idzie przez
  `render={<Link />}`, nie przez `asChild`.
- Formularze i akcje w panelu chodzą przez `useServerAction()` (`hooks/use-server-action.ts`)
  oraz `ActionButton`/`IconAction` — nie pisz własnego `useTransition` z obsługą błędu.
- Pola formularzy: `Field`, `inputClass` i `FormError` z `components/dashboard/form-controls.tsx`.
- Helpery dat są w `lib/dates.ts` — używaj `dayKey`/`monthKey` zamiast `toISOString()`.
- Strony w panelu składają się z `Header` + `Panel`/`EmptyState`; listy dostają `StatusBadge`.

## Strona publiczna (`app/(front)/**`)

- Front i panel to dwa osobne systemy wizualne. Strona publiczna żyje pod
  `data-surface="front"`, używa tokenów `--front-*` i komponentów z
  `components/front/**`; nie sięga po `components/ui/*` ani po tokeny panelu
  (`DESIGN.md`, Sealed-Surface Rule).
- **Dane publiczne wyłącznie przez `lib/public/*`.** Komponent strony nie woła
  `prisma` bezpośrednio — filtry `isPublished` / `isActive` / `APPROVED` /
  `PUBLISHED` mieszkają w jednym miejscu, bo pominięcie jednego z nich to
  wyciek treści.
- Katalog (przedmioty, poziomy, nauczyciele, cennik, grupy, opinie, CMS) idzie
  przez `unstable_cache` z tagami z `lib/tags.ts`. **Każda akcja panelu, która
  zmienia coś widocznego na stronie, woła `revalidateTags(...)`** obok
  `revalidatePath` — sama ścieżka odświeża tylko panel. Zmiana pokazuje się na
  froncie przy kolejnym wejściu (stale-while-revalidate z `profile="max"`).
- **Dostępności nie cache'ujemy nigdy.** Wolne terminy liczy `getSlotBoard()`
  z `lib/public/availability.ts` przy każdym żądaniu — jednym zapytaniem na typ,
  nie w pętli po nauczycielach. To samo dotyczy liczby miejsc w grupie i statusu
  rezerwacji.
- Akcje anonima leżą w `lib/actions/public/*`, **zwracają `{ ok, errors }`
  zamiast rzucać** (formularz musi podświetlić pole) i zaczynają się od bramki
  z `lib/actions/public/guard.ts`: pole-pułapka, podpisany znacznik czasu,
  limit z adresu i z kontaktu. Adresu IP nie zapisujemy w żadnej tabeli.
- Reguły dziedzinowe sprawdzamy **ponownie** w akcji, nawet jeśli przeglądarka
  pokazała tylko poprawne wartości — między wyborem terminu a wysyłką ktoś mógł
  go zająć.
- Formularze publiczne: `useFormAction()` (`hooks/use-form-action.ts`) plus pola
  z `components/front/forms/*`. Panelowy `useServerAction()` i
  `components/dashboard/form-controls.tsx` zostają przy panelu.
- Wspólna logika zapisu do grupy jest w `lib/enrollment.ts` — panel i front
  wołają tę samą funkcję i dokładają wokół niej własną bramkę.
- Konto ucznia (`/konto/**`) chroni `ensureAccountPage()` z `lib/auth.ts`:
  wpuszcza każdego zalogowanego, bo nauczyciel i admin też mogą mieć własne
  lekcje. To osobna bramka niż `ensureDashboardPage()`.
- Nowa strona CMS nie może zająć slugu trasy stałej — lista jest w
  `lib/public/reserved-slugs.ts` i czyta ją edytor stron oraz mapa witryny.
- Treść, która wygląda na prawdziwą, a nią nie jest, idzie na listę w
  `docs/ZASLEPKI.md`. Po przeniesieniu danych do bazy `sampleTag` już jej
  nie oznacza.
