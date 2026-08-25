# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dwie osoby decydują razem i strona główna musi złapać obie: **uczeń** (szkoła
podstawowa, liceum, technikum, matura, czasem pierwsze lata studiów), który chce
przestać się bać sprawdzianu, oraz **rodzic**, który płaci i potrzebuje pewności,
że to nie kolejne wyrzucone 400 zł miesięcznie. Uczeń zwykle znajduje i chce,
rodzic zatwierdza i kontaktuje się.

Trzecia grupa, poza stroną główną: **nauczyciele i admin**, którzy pracują w
panelu `/dashboard` (grafik, rezerwacje, cennik, grupy). To osobny produkt o
własnym języku wizualnym — strona publiczna nie musi się z nim zgadzać.

## Product Purpose

Serwis korepetycji, w którym cała droga „potrzebuję pomocy → mam umówioną lekcję"
dzieje się bez wymiany dziesięciu wiadomości. Uczeń albo rodzic widzi realnie
wolne godziny konkretnego nauczyciela, wybiera termin, dostaje potwierdzenie.
Sukces to umówiona pierwsza lekcja, nie zapisanie się do newslettera.

## Positioning

Grafik jest prawdziwy, nie deklaratywny. Wolne terminy liczy silnik dostępności
(`lib/availability.ts`) z reguł tygodnia, wyjątków, istniejących rezerwacji,
buforów i godzin zajęć grupowych — więc godzina pokazana na stronie jest
faktycznie wolna, a nie „napisz, to się dogadamy". Sąsiednie serwisy z ogłoszeniami
korepetycji pokazują profile i numer telefonu; tu widać kalendarz.

Drugi wyróżnik: cena wynika z reguł (`PriceRule`, poziom → przedmiot → nauczyciel),
jest jawna przed kontaktem i zapisuje się jako migawka przy rezerwacji.

## Operating Context

- Uczeń trafia na stronę wieczorem, często z telefonu, często dzień lub dwa przed
  sprawdzianem. Rodzic otwiera ją później na laptopie, żeby sprawdzić cenę i
  wiarygodność.
- Zajęcia odbywają się online, u nauczyciela albo u ucznia — lokalizacje należą do
  konkretnego nauczyciela, nie ma wspólnego słownika.
- Zajęcia indywidualne rozliczane po lekcji; zajęcia grupowe abonamentem miesięcznym
  ze stałym terminem w tygodniu.
- Rezerwacja bez konta jest możliwa (dane gościa), konto nie jest bramką.

## Capabilities and Constraints

- Zespół: **kilku nauczycieli**. Strona publiczna pokazuje, kto czego uczy, i
  pozwala wybrać osobę przy zapisie. Role: `ADMIN`, `TEACHER`, `STUDENT`; profil
  nauczyciela (`TeacherProfile`) jest niezależny od roli.
- Przedmioty i poziomy są danymi z bazy (`Subject`, `Level`), nie stałą w kodzie —
  landing może je mieć na twardo tylko tymczasowo.
- Cennik indywidualny w chwili pisania: podstawówka 80 zł/h, szkoła średnia
  100 zł/h, matura 120 zł/h. Grupy: ósmoklasista 250 zł/mies (4 × 60 min),
  matura 350 zł/mies (4 × 90 min), grupy 4–8 osób, rabat 20% dla uczniów zajęć
  indywidualnych.
- Reguły rezerwacji z `SiteSettings`: minimalne wyprzedzenie 12 h, horyzont 60 dni,
  potwierdzanie ręczne (bez auto-potwierdzania).
- Brak płatności online w MVP. Brak wysyłki maili transakcyjnych — potwierdzenie
  robi człowiek z panelu.
- Stack zastany: Next.js 16 (App Router, RSC), React 19, Tailwind 4, Prisma 7 +
  PostgreSQL, Clerk (`plPL`). Cała aplikacja po polsku.
- Panel `/dashboard` ma własny język wizualny (shadcn na Base UI, gęsta siatka
  paneli, jasny/ciemny motyw). Strona publiczna **nie** musi go dziedziczyć —
  decyzja właściciela z 2026-08-25.

## Brand Commitments

- Nazwa: **Korki na patencie**. „Na patencie" = sposób, trik, „ogarnięte" —
  nazwa obiecuje spryt i lekkość, nie akademicką powagę.
- Język: polski, w całości. Ton ma być jednocześnie przyjazny i zabawny oraz
  elegancki i profesjonalny — bez korpo-mowy i bez infantylizacji ucznia.
- Strona publiczna ma **oba motywy — jasny i ciemny** — z przełącznikiem w
  nagłówku, wspólnym z panelem (`next-themes`). Paleta frontu jest własna i nie
  dziedziczy tokenów panelu (decyzja właściciela z 2026-08-25; wcześniejsze
  „tylko jasny” zostało tego samego dnia zmienione).
- **Trwała preferencja kierunku (2026-08-25):** strona publiczna trzyma się
  standardu kategorii zagranego prosto — bez ironii i bez przemyconej ekscentryki.
  Poprzeczką rzemiosła są **Duolingo, Khan Academy i Brainly**: żywy kolor,
  zaokrąglona geometria, wyraźne przyciski, porządek siatki zamiast powietrza.
  Właściciel świadomie odrzucił bardziej autorskie kierunki na rzecz czytelności.
- Brak logotypu, brandbooka i kolorów firmowych. Obecna ikona (czapka absolwenta w
  kwadracie) jest zaślepką z etapu 1, nie zobowiązaniem.

## Evidence on Hand

**Na dziś: brak jakichkolwiek prawdziwych dowodów.** Właściciel świadomie odkłada
import realnych treści, więc każda opinia, liczba, zdjęcie, nazwisko nauczyciela,
telefon, e-mail i miasto na stronie są **zaślepkami** i muszą być tak oznaczone w
kodzie oraz zebrane w liście „do podmiany".

Czego nie wolno zmyślać jako faktu: liczby uczniów, wyniki matur, oceny,
nagrody, nazwy szkół, cytowane opinie, referencje. Ceny i reguły rezerwacji są
prawdziwe (wyżej) — te wolno pokazywać.

Realne materiały, które istnieją: cennik, przedmioty, poziomy, format zajęć
grupowych, logika dostępności — czyli sam mechanizm produktu.

## Product Principles

1. **Termin przed rozmową.** Najkrótsza droga to pokazanie wolnej godziny, nie
   zaproszenie do kontaktu. Wszystko, co oddala od terminu, jest kosztem.
2. **Cena jawna od pierwszego ekranu.** Ukryty cennik to dla rodzica sygnał
   ostrzegawczy; jawny jest przewagą, bo ceny są uczciwe i regułowe.
3. **Dwie głowy, jedna strona.** Każda sekcja musi działać dla ucznia (energia,
   konkret, brak ściemy) i dla rodzica (wiarygodność, jasne warunki).
4. **Nie obiecujemy cudu.** Produkt sprzedaje zrozumienie i plan, nie gwarancję
   oceny. Żadnych wymyślonych wyników.
5. **Panel to inny świat.** Strona publiczna odpowiada za wrażenie i decyzję,
   panel za robotę. Nie muszą wyglądać tak samo i nie będą.

## Accessibility & Inclusion

Znaczna część ruchu to telefony ucznia — układ mobilny jest pierwszorzędny, nie
wersją zapasową. Teksty po polsku z pełną diakrytyką; kontrast i rozmiary dotyku
muszą działać dla rodzica czytającego wieczorem na laptopie i dla ucznia w
autobusie.
