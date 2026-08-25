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
