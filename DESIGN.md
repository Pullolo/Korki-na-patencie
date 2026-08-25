---
name: Korki na patencie — strona publiczna
description: Kanon kategorii edukacyjnej zagrany prosto: winogronowa marka, wciskane przyciski i grafik, w który da się kliknąć.
colors:
  front-ground: "#fbfaff"
  front-surface: "#ffffff"
  front-ink: "#1a1830"
  front-muted: "#5a5878"
  front-line: "#e8e6f4"
  front-line-strong: "#d6d2ee"
  front-brand: "#5b47e0"
  front-brand-hover: "#6a58ea"
  front-brand-edge: "#4432c2"
  front-brand-soft: "#eeebff"
  front-on-brand: "#ffffff"
  front-sun: "#c97f00"
  front-sun-soft: "#fff3d6"
  front-coral: "#d1452f"
  front-coral-soft: "#ffe7e2"
  front-mint: "#0a7d66"
  front-mint-soft: "#dff7f0"
  front-sky: "#1568b5"
  front-sky-soft: "#e3f1ff"
  front-band-warm: "#fff3d6"
  front-cta: "#5b47e0"
  front-cta-edge: "#4432c2"
  front-cta-border: "#7a68ee"
  front-cta-pill-edge: "#c8bffb"
  front-on-cta-muted: "#ddd7ff"
  front-dots: "#dedaf6"
  front-selection: "#ddd7ff"
  front-scroll-thumb: "#c6bff2"
  front-scroll-track: "#f1eefc"
typography:
  display:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  numeral:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Nunito, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Nunito, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  micro:
    fontFamily: "Nunito, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.025em"
rounded:
  sm: "12px"
  md: "16px"
  lg: "24px"
  card: "28px"
  band: "32px"
  full: "9999px"
spacing:
  hairline: "6px"
  xs: "12px"
  sm: "16px"
  md: "20px"
  lg: "24px"
  xl: "36px"
  block: "48px"
  section: "80px"
  section-wide: "96px"
components:
  button-primary:
    backgroundColor: "{colors.front-brand}"
    textColor: "{colors.front-on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 28px"
    height: "3.25rem"
  button-primary-hover:
    backgroundColor: "{colors.front-brand-hover}"
  button-secondary:
    backgroundColor: "{colors.front-surface}"
    textColor: "{colors.front-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 28px"
    height: "3.25rem"
  button-small:
    backgroundColor: "{colors.front-ground}"
    textColor: "{colors.front-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "2.5rem"
  button-small-hover:
    backgroundColor: "{colors.front-brand-soft}"
    textColor: "{colors.front-brand}"
  chip:
    backgroundColor: "{colors.front-ground}"
    textColor: "{colors.front-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-selected:
    backgroundColor: "{colors.front-ink}"
    textColor: "{colors.front-surface}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.front-surface}"
    textColor: "{colors.front-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  slot-card:
    backgroundColor: "{colors.front-surface}"
    textColor: "{colors.front-ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  cta-band:
    backgroundColor: "{colors.front-cta}"
    textColor: "{colors.front-on-brand}"
    rounded: "{rounded.band}"
    padding: "64px 24px"
  sample-tag:
    backgroundColor: "{colors.front-brand-soft}"
    textColor: "{colors.front-brand}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Korki na patencie — strona publiczna

> Ten dokument opisuje **wyłącznie stronę publiczną** (`app/page.tsx`, `components/front/**`, blok `--front-*` w `app/globals.css`). Panel pod `app/dashboard/**` to osobny, wcześniejszy system wizualny (shadcn na Base UI, tokeny `--background` / `--primary`, gęsty layout z paskiem 16rem) i pozostaje poza tym zapisem — nie dziedziczy stąd niczego i niczego tu nie oddaje.

## Overview

**Creative North Star: „Jasna klasa z grafikiem na ścianie"**

Świat jest kanonem kategorii edukacyjnej zagranym prosto — poprzeczka to Duolingo, Khan i Brainly, bez ironii i bez prób bycia czymś innym. Grunt jest jasny, prawie biały z fioletowym podbiciem; winogronowy `--front-brand` jest jedynym głosem marki, a cztery kolory pomocnicze (słońce, koral, mięta, błękit) służą wyłącznie do rozróżniania rzeczy, nie do dekoracji. Powierzchnia jest gęsto zaokrąglona, przyciski dają się wcisnąć, a odręczne akcenty (zakreślacz, strzałka) mówią „ktoś to napisał ręką", nie „to jest ilustracja".

Gęstość jest niska i celowa: jedna kolumna treści szeroka na 1152 px, sekcje oddzielone 80–96 px oddechu, akapity twardo ograniczone miarą (`max-w-[46ch]`, `max-w-[60ch]`, `max-w-[68ch]`). Strona nie zagaduje — mówi, kto uczy, ile to kosztuje i kiedy jest wolne, a jedynym elementem, który cokolwiek robi, jest karta wyboru terminu w pierwszym widoku.

Świat jest w całości dwumotywowy. Każdy token `--front-*` jest zdefiniowany dwa razy — jasno w `:root`, ciemno w `.dark` — więc żaden komponent frontu nigdy nie sięga po token panelu i żaden nie potrzebuje wariantu `dark:` poza dosłownym przełącznikiem ikony w `ThemeToggle`.

**Key Characteristics:**
- Winogronowa marka na jasnofioletowym gruncie, cztery kolory pomocnicze wyłącznie jako sygnał kategorii
- Fredoka do nagłówków i liczb, Nunito do zdań — podział ról, nie mieszanka
- Wciskany przycisk z cieniem o zerowym rozmyciu; reszta powierzchni płaska albo miękko uniesiona
- Drabina promieni 12 / 16 / 24 / 28 / 32 px, nic kanciastego
- Jeden autorski moment ruchu (`front-slot-in`), poza nim tylko przejścia stanów
- Wszystko dwumotywowe u źródła: token świeci w `:root` i w `.dark`, nigdy tylko w jednym

## Colors

Paleta jest chłodno-fioletowa z czterema ciepłymi i zimnymi akcentami, które niosą znaczenie: każdy przedmiot, poziom i status dostaje swój kolor i trzyma go przez całą stronę.

### Primary
- **Winogron** (`--front-brand` / `--front-brand-solid`): marka. Wypełnienie głównego przycisku, kafelek logo, numery kroków, kolor zakreślacza pod słowem w nagłówku `h1`, kolor karetki i obramowania focus. W trybie ciemnym rozjaśnia się do `#a99bff` jako kolor tekstu, ale wypełnienie zostaje ciemniejsze (`--front-brand-solid: #6a57f0`) — to dwa różne zadania jednego koloru.
- **Winogron krawędź** (`--front-brand-edge`): wyłącznie dolna krawędź wciskanego przycisku. Nigdy jako tło ani tekst.
- **Winogron mgła** (`--front-brand-soft`): tło pasma „Jak to działa", podświetlenie nawigacji, kafelki ikon, tło znacznika zaślepki.

### Secondary — cztery kolory pomocnicze
Każdy występuje w parze: nasycony do tekstu i ikon, mglisty do tła.
- **Słońce** (`--front-sun` / `--front-sun-soft`): gwiazdki opinii, naklejka „pierwsza lekcja bez zobowiązań", pasek rabatu grupowego.
- **Koral** (`--front-coral` / `--front-coral-soft`): zarezerwowany, dziś nieużywany. Czeka na czwartą kategorię (przedmiot albo status); dopóki nie ma dla niego znaczenia, nie wolno go użyć dekoracyjnie.
- **Mięta** (`--front-mint` / `--front-mint-soft`): dostępność i potwierdzenia — wolne godziny, listy „co dostajesz", informatyka w wyborze przedmiotu.
- **Błękit** (`--front-sky` / `--front-sky-soft`): fizyka i poziom cennika.

### Tertiary — powierzchnia CTA
- **Pasmo CTA** (`--front-cta`, `--front-cta-edge`, `--front-cta-border`, `--front-cta-pill-edge`, `--front-on-cta`, `--front-on-cta-muted`): zamknięta rodzina dla jednego, pełnokolorowego pasma kontaktowego. Marka staje się tam gruntem, więc przyciski muszą mieć własne krawędzie — stąd osobne tokeny, a nie nadpisania w klasach.

### Neutral
- **Grunt** (`--front-ground`): domyślne tło strony i pasm „chłodnych", tło nieaktywnych kafelków godzin.
- **Powierzchnia** (`--front-surface`): karty, nagłówek strony, pasma „jasne".
- **Atrament** (`--front-ink`): cały tekst podstawowy oraz wypełnienie wybranego przycisku w wyborze terminu — zaznaczenie jest atramentowe, nie markowe.
- **Przygaszony** (`--front-muted`): opisy, podpisy, nawigacja w spoczynku, metadane cen.
- **Linia** / **Linia mocna** (`--front-line`, `--front-line-strong`): obramowania kart, przegrody wierszy, przerywana nitka między krokami, hover obramowania.
- **Kropki**, **Zaznaczenie**, **Kciuk paska**, **Tor paska** (`--front-dots`, `--front-selection`, `--front-scroll-thumb`, `--front-scroll-track`): siatka punktów w hero i powierzchnie przeglądarki.

### Named Rules

**The Two-Definition Rule.** Każdy token `--front-*` jest zapisany dwa razy: wartość jasna w `:root`, ciemna w `.dark`. Nowy token, który istnieje tylko w jednym motywie, jest błędem — nie wolno go łatać wariantem `dark:` w komponencie.

**The Sealed-Surface Rule.** Front nie czyta tokenów panelu (`--background`, `--primary`, `--foreground`) i nie eksportuje swoich. Cała powierzchnia publiczna żyje pod `[data-surface="front"]`; to selektor, na którym wiszą tło, karetka, zaznaczenie, pasek przewijania i obramowanie focus.

**The Meaning-Not-Mood Rule.** Kolor pomocniczy zawsze coś znaczy — przedmiot, poziom, status. Matematyka jest winogronowa, fizyka błękitna, informatyka miętowa, i tak samo w kartach przedmiotów, w wyborze terminu i w sygnaturach. Nie wolno użyć koralu ani słońca „dla urozmaicenia".

**The Warm-Band-Collapses Rule.** `--front-band-warm` to jedyny token, który w trybie ciemnym celowo zrównuje się z gruntem (`#131120`). Ciepłe pasmo opinii istnieje tylko w jasnym motywie; w ciemnym karty niosą je same.

## Typography

**Display Font:** Fredoka (400 / 500 / 600, `--font-display`, ładowana w `app/page.tsx`)
**Body Font:** Nunito (zmienna, `--font-body`, ładowana w `app/page.tsx`)

**Character:** Fredoka jest okrągła i przyjazna bez infantylizmu — nadaje nagłówkom i liczbom charakter tablicy, na której ktoś napisał cenę. Nunito pod spodem jest neutralna i czytelna w długich akapitach, z wyraźnie cięższym bold (700) używanym jako etykieta. Obie mają pełne `latin-ext`, bo cała strona jest po polsku.

### Hierarchy
- **Display** (Fredoka 600, `2.6rem` → `sm:3.75rem`, line-height `1.18`, tracking `-0.02em`): wyłącznie `h1` w hero. Zawsze z `text-balance`.
- **Headline** (Fredoka 600, `2.25rem` → `sm:3rem`, leading-tight, tracking `-0.02em`): nagłówki sekcji `h2`. Zawsze z miarą (`max-w-[16ch]`–`max-w-[20ch]`) i `text-balance`.
- **Title** (Fredoka 600, `1.5rem`; wariant listowy `1.25rem`, `1.125rem`): nazwy przedmiotów, kroków, poziomów cennika, pytania FAQ.
- **Numeral** (Fredoka 600, `1.875rem` / `1.5rem`, leading-none): kwoty i wybrany termin. Ceny to zawsze Fredoka, nigdy Nunito.
- **Body** (Nunito 400, `1.125rem`, leading-relaxed): akapity wprowadzające i cytaty. Miara 46–68 znaków, zawsze zadeklarowana.
- **Label** (Nunito 700, `0.875rem` / `1rem`): przyciski, chipy, nawigacja, metadane. W wyborze terminu godziny dostają `tabular-nums`.
- **Micro** (Nunito 700, `0.75rem`, tracking-wide, wersaliki): wyłącznie `sampleTag`.

### Named Rules

**The Role-Split Rule.** Fredoka mówi „co to jest i ile kosztuje" (nagłówki, nazwy, liczby). Nunito mówi zdaniami (akapity, etykiety, przyciski). Akapit złożony Fredoką i cena złożona Nunito to obie ta sama pomyłka.

**The Polish Widow Rule.** Po każdym jednoliterowym słowie (`i`, `w`, `z`, `o`, `a`, `u`) idzie twarda spacja — w nagłówkach i w treści. Tam, gdzie łamanie ma paść w konkretnym miejscu, fraza dostaje `whitespace-nowrap` na własnym `<span>`, a nagłówek `text-balance`. Nagłówek złamany tak, że wers kończy się na „i", jest defektem.

**The Weight-Ceiling Rule.** Fredoka jest ładowana tylko do 600 i tylko `font-semibold` jest w użyciu. Nie ma nagłówka cięższego niż 600; siłę daje rozmiar i tracking, nie waga.

## Layout

Jedna kolumna centralna `max-w-6xl` (1152 px) z marginesem `20px` → `sm:24px`; sekcja FAQ zawęża się do `max-w-3xl` (768 px), bo pytania czyta się w jednej kolumnie. Rytm pionowy sekcji: `py-80px` → `sm:py-96px`, hero osobno `py-64px` → `lg:py-96px`.

Hero jest jedynym układem asymetrycznym: `lg:grid-cols-[1.02fr_0.98fr]` — tekst po lewej minimalnie szerszy niż karta terminu po prawej, wyrównane do środka w pionie, przerwa `48px` → `lg:64px`. Poniżej `lg` kolumny składają się w stos, a odręczna strzałka nad kartą znika (`hidden lg:flex`), bo nie ma już do czego wskazywać.

Siatki treści są trzy i tylko trzy: `md:grid-cols-3` dla kart (przedmioty, kroki, opinie), `lg:grid-cols-[1fr_1fr]` dla dwóch kart grupowych, oraz pojedyncza kolumna wierszy dla list dzielonych. Wewnątrz wyboru terminu: `grid-cols-5` dla dni tygodnia (stały tydzień roboczy) i `grid-cols-3` → `sm:grid-cols-4` dla godzin.

**Rytm pasm sekcji.** Tła idą naprzemiennie i nigdy dwa te same obok siebie: grunt (hero) → powierzchnia (przedmioty) → mgła markowa (jak to działa) → powierzchnia (nauczyciele) → grunt (cennik) → pasmo ciepłe (opinie) → powierzchnia (FAQ) → grunt z pełnokolorowym blokiem CTA w środku. Granicę sekcji wyznacza zmiana tła, nie linia.

Nagłówek strony jest przyklejony (`sticky top-0`, `h-72px`), półprzezroczysty (`bg-front-surface/90`) z `backdrop-blur-sm` i dolną linią. Nawigacja główna pojawia się dopiero od `lg`; poniżej zostaje logo, przełącznik motywu i przyciski konta.

### Named Rules

**The Measure Rule.** Każdy akapit ma zadeklarowaną miarę w `ch` (46–68). Tekst rozciągnięty na pełne 1152 px nie wchodzi na stronę.

## Elevation & Depth

System ma dwa oddzielne słowniki głębi i nie wolno ich mieszać. Cienie **konstrukcyjne** o zerowym rozmyciu (`0 4px 0 0`) są fizyką przycisku: mówią „to się da wcisnąć" i pod naciskiem kurczą się do `0 1px 0 0`, gdy element zjeżdża o 3 px. Cienie **atmosferyczne** — duże, mocno rozmyte, z ujemnym rozlaniem i kolorem liczonym z `--front-ink` przez `color-mix` — tylko unoszą karty nad gruntem i nie reagują na kliknięcie.

### Shadow Vocabulary
- **Krawędź wciskana** (`box-shadow: 0 4px 0 0 var(--front-brand-edge), 0 14px 26px -14px color-mix(in oklch, var(--front-brand-edge), transparent 20%)`): przycisk główny w spoczynku. Wariant wtórny używa `--front-line` jako krawędzi.
- **Krawędź wciśnięta** (`box-shadow: 0 1px 0 0 var(--front-brand-edge), 0 8px 16px -12px …`) razem z `translateY(3px)`: stan `:active`.
- **Uniesienie karty** (`box-shadow: 0 18px 40px -28px color-mix(in oklch, var(--front-ink), transparent 60%)`): `cardBase` — wszystkie karty i listy dzielone.
- **Uniesienie karty terminu** (`box-shadow: 0 30px 60px -32px color-mix(in oklch, var(--front-ink), transparent 55%)`): tylko karta wyboru terminu; jest bohaterem pierwszego widoku i stoi wyżej niż reszta.
- **Naklejka** (`box-shadow: 0 10px 20px -14px color-mix(in oklch, var(--front-ink), transparent 40%)` + `ring-1`): obrócona etykieta nad kartą terminu.

### Named Rules

**The Pressable-Edge Rule.** Cień o zerowym rozmyciu nosi wyłącznie kontrolka, którą naprawdę da się wcisnąć — przycisk lub link-akcja z `:active`. Karta, pasmo, chip informacyjny i naklejka nigdy go nie dostają. Test: jeśli element nie ma stanu `:active`, nie ma prawa do dolnej krawędzi.

**The Card-Lift-Is-Ambient Rule.** Karta unosi się cieniem rozmytym i reaguje na hover wyłącznie przesunięciem (`hover:-translate-y-1`, 200 ms) — cień się nie zmienia. Głębia jest tłem, nie sprzężeniem zwrotnym.

## Shapes

Drabina promieni jest ciągła i wszystko na niej leży: `12px` dla drobnych kontrolek (przycisk mały, przełącznik motywu, kafelki godzin i dni, kafelek stopki), `16px` dla przycisków głównych, kafelków ikon i sygnatur, `24px` dla kart, `28px` dla karty wyboru terminu, `32px` dla pasma CTA. Chipy, sygnatury opinii i strzałka FAQ są w pełni owalne. Kanciasty róg nie występuje nigdzie — łącznie z obramowaniem focus, które samo wymusza `border-radius: 0.5rem`.

Obramowania są cienkie i jednorodne: `1px` w kolorze linii wokół kart, `2px` przy kontrolkach, które muszą wyglądać na klikalne (przycisk wtórny, kafelki dni). Nitka między krokami jest jedynym miejscem z linią przerywaną (`border-t-2 border-dashed`), bo opisuje trasę, nie przegrodę.

Trzy pasma kart różnią się celowo geometrią, bo różnią się typem treści:
- **Siatka kart** (przedmioty, kroki): równe karty `24px` promienia, padding `24px`, hover unoszący.
- **Lista dzielona** (nauczyciele, cennik, FAQ): jedna karta z `divide-y divide-front-line` i `overflow-hidden`, wiersze `24px` → `sm:px-32px`. Porównywalne pozycje muszą leżeć w jednym pudełku, nie w trzech.
- **Rozsypane notatki** (opinie): te same karty, ale obrócone `-1°` / `0.7°` / `-0.5°` i schodkowane `md:mt-32px` / `md:mt-64px`. Wypowiedź to karteczka, nie wiersz tabeli.

Odręczne akcenty (`Squiggle`, `ArrowDoodle`, `Sparkle`) są rysowane jedną grubością kreski z zaokrąglonymi końcami i biorą kolor z `currentColor`. Zakreślacz `Marker` leży **pod** tekstem (`z-0` vs `z-10`), lekko obrócony, w mglistym wariancie koloru — nie rusza kontrastu ani zaznaczania.

### Named Rules

**The Static-Doodle Rule.** Odręczne akcenty są statyczne z definicji. Animacja „rysowania się" została usunięta, bo nie startowała w karcie, która nie renderuje klatek — akcent znikał w zrzutach i na dławionych kartach. Element dekoracyjny, który zależy od klatek, żeby w ogóle być widocznym, nie wchodzi.

## Components

### Buttons
Charakter: duże, ciężkie i fizyczne — w standardzie produktów edukacyjnych, nie w skali paska narzędzi.
- **Kształt:** mocno zaokrąglone rogi (`16px`), wysokość `3.25rem`, padding poziomy `28px`, ikona `20px` po prawej.
- **Główny (`btnPrimary`):** winogronowe wypełnienie, biały tekst, krawędź wciskana. Hover rozjaśnia wypełnienie do `--front-brand-hover`, `:active` zjeżdża o `3px` i spłaszcza krawędź. Przejście `150ms` na `transform, box-shadow, background-color`.
- **Wtórny (`btnSecondary`):** powierzchnia z obramowaniem `2px` w kolorze linii, ta sama mechanika wciskania, ale krawędzią jest `--front-line`. Hover pogrubia kolor obramowania do `--front-line-strong`.
- **Mały (`btnSmall`):** wysokość `2.5rem`, promień `12px`, ikona `16px`, **bez** krawędzi wciskanej — to kontrolka nagłówka, nie akcja główna. Hover: mgła markowa plus markowy tekst.
- **Na paśmie CTA:** oba przyciski dostają nadpisania kolorów z rodziny `--front-cta-*`; mechanika i wysokość zostają bez zmian.
- **Disabled:** `pointer-events: none`, krycie `0.6`. Bez zmiany kształtu.

### Chips
- **Informacyjny (`chip`):** owal, tło gruntu, przygaszony tekst, `600`. Poziomy nauczania w kartach przedmiotów.
- **Wybieralny (wybór terminu):** w spoczynku mglisty wariant koloru przedmiotu; wybrany — atramentowe tło, tekst w kolorze powierzchni i `ring-2` w kolorze przedmiotu z odstępem `ring-offset-2`. Zaznaczenie jest atramentowe, a kolor przedmiotu wraca jako pierścień.

### Cards / Containers
- **Promień:** `24px` (`cardBase`), `28px` dla karty terminu, `32px` dla pasma CTA.
- **Tło i obramowanie:** powierzchnia z linią `1px`.
- **Cień:** uniesienie atmosferyczne — patrz Elevation & Depth.
- **Padding wewnętrzny:** `24px`, w wierszach list `24px` → `sm:32px` poziomo, karty grupowe `24px` → `sm:32px`.

### Navigation
Etykiety Nunito `600` w kolorze przygaszonym, kapsuła `12px` na hover z mglistym tłem i markowym tekstem. Widoczna od `lg`; niżej nawigacja zostaje tylko w stopce, jako zawijany rząd linków bez kapsuł.

### Slot Picker (komponent sygnaturowy)
Jedyny interaktywny element strony publicznej i cała treść prawej połowy pierwszego widoku. Karta `28px` z najwyższym cieniem w systemie, nad nią obrócona o `7°` naklejka w kolorze słońca. W środku cztery poziomy w stałej kolejności: przedmiot (owalne chipy) → dzień (siatka pięciu kafelków `12px` z obramowaniem `2px`) → godzina (kafelki `12px`, `tabular-nums`) → podsumowanie z ceną i przycisk główny na pełną szerokość.

Dzień bez wolnych godzin nie znika — zostaje jako kafelek przekreślony, na gruncie, z przygaszonym tekstem i `cursor-not-allowed`. Brak dostępności to informacja, nie pustka.

**Jedyny autorski moment ruchu.** Zmiana przedmiotu albo dnia przemontowuje siatkę godzin (`key`), a każdy kafelek wjeżdża animacją `front-slot-in` (`0.42s`, `cubic-bezier(0.16, 1, 0.3, 1)`, z `opacity`, `translateY(8px)`, `scale(0.94)` i `blur(3px)`), kaskadą co `45ms`. Poza tym na stronie nie ma **żadnej** animacji wejścia — reszta ruchu to przejścia stanów po `150ms` (kolor) albo `200ms` (transform). Przy `prefers-reduced-motion: reduce` animacja skraca się do `0.01ms`, a wszystkie przejścia frontu są wyłączone.

### Themed browser surfaces
Powierzchnie przeglądarki są częścią systemu, nie ustawieniem domyślnym. Pod `[data-surface="front"]`: `color-scheme` przełączany razem z motywem, tło `<html>` i `<body>` w kolorze gruntu (żeby overscroll nie pokazywał bieli panelu), pasek przewijania w `--front-scroll-thumb` / `--front-scroll-track`, karetka w kolorze marki, zaznaczenie tekstu na `--front-selection` z atramentowym tekstem, a `:focus-visible` dostaje obramowanie `3px` w kolorze marki z odstępem `2px` i promieniem `0.5rem`.

### Placeholder marking (`sampleTag`)
Treść, która czeka na prawdziwe dane, jest oznaczona jawnie: owalna plakietka na mgle markowej, Nunito `700`, `12px`, wersaliki, tracking-wide — zawsze bezpośrednio przy sekcji, której dotyczy, w jednym rzędzie ze zdaniem wyjaśniającym, co ją zastąpi. Zaślepka jest opisana na stronie, a nie ukryta przed czytelnikiem.

## Do's and Don'ts

### Do:
- **Do** definiować każdy nowy token frontu dwa razy — jasno w `:root`, ciemno w `.dark` — zanim użyjesz go w komponencie.
- **Do** trzymać się drabiny promieni `12 / 16 / 24 / 28 / 32 px` i pełnego owalu dla chipów.
- **Do** dawać cień o zerowym rozmyciu wyłącznie kontrolkom ze stanem `:active`.
- **Do** składać nagłówki i wszystkie kwoty krojem Fredoka `600`, a zdania krojem Nunito.
- **Do** wstawiać twardą spację po jednoliterowym słowie i dokładać `whitespace-nowrap` tam, gdzie łamanie musi paść w konkretnym miejscu.
- **Do** deklarować miarę akapitu w `ch` (46–68) przy każdym bloku tekstu.
- **Do** prowadzić rytm pasm przez naprzemienne tła (grunt / powierzchnia / kolor), a nie przez linie rozdzielające.
- **Do** oznaczać każdą treść-zaślepkę klasą `sampleTag` i zdaniem mówiącym, co ją zastąpi.
- **Do** używać wyłącznie ikon lucide w jednej wadze i jednym rozmiarze na kontekst (`20px` w przyciskach, `16px` w małych, `24px` w kafelkach przedmiotów).

### Don't:
- **Don't** sięgać po tokeny panelu (`--background`, `--primary`, `--foreground`, `--sidebar-*`) ani po `components/ui/button` na stronie publicznej — panel jest skalowany pod inną gęstość.
- **Don't** dokładać wariantów `dark:` do kolorów; motyw ma iść przez parę tokenów, nie przez klasę. Wyjątkiem jest podmiana ikony w `ThemeToggle`.
- **Don't** dawać karcie, paśmie ani plakietce dolnej krawędzi wciskanej — to obietnica kliknięcia, której nie spełniają.
- **Don't** dodawać animacji wejścia poza `front-slot-in`; strona ma jeden moment ruchu i on należy do wyboru godziny.
- **Don't** uzależniać widoczności elementu od animacji — akcenty odręczne są statyczne z definicji.
- **Don't** używać koloru pomocniczego dekoracyjnie; słońce, koral, mięta i błękit zawsze niosą kategorię, poziom albo status.
- **Don't** obciążać nagłówka wagą powyżej `600` ani ładować Fredoki w cięższych odmianach.
- **Don't** ukrywać braku dostępności — dzień bez godzin zostaje na siatce jako kafelek przekreślony.
- **Don't** rozciągać akapitu na pełną szerokość kolumny `max-w-6xl`.
