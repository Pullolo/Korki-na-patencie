-- Zapis do grupy dostaje własny kod, tak jak rezerwacja. To klucz dostępu
-- do strony statusu `/zapis/[kod]`, którą uczeń dostaje po wysłaniu formularza.

-- 1. Kolumna najpierw jako opcjonalna, żeby dało się wypełnić istniejące wiersze.
ALTER TABLE "group_enrollments" ADD COLUMN IF NOT EXISTS "reference" TEXT;

-- 2. Kody dla zapisów, które powstały wcześniej w panelu. Skrót z `id` daje
--    wartość różną dla każdego wiersza; podstawienie zdejmuje z niego zera
--    i jedynki, bo alfabet kodów ma nie mylić się przy dyktowaniu przez telefon.
UPDATE "group_enrollments"
SET "reference" = 'GRP-' || translate(upper(substr(md5("id"), 1, 4)), '01', 'WX');

-- 3. Dopiero teraz kolumna staje się wymagana i unikalna.
ALTER TABLE "group_enrollments" ALTER COLUMN "reference" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "group_enrollments_reference_key" ON "group_enrollments"("reference");
