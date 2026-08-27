import { z } from "zod"

/**
 * Wspólne schematy dla formularzy publicznych.
 *
 * Wejście od anonima przechodzi przez sześć akcji, a komunikaty muszą być
 * identyczne w każdej z nich — dlatego jeden zestaw schematów zamiast
 * ręcznych walidatorów rozsypanych po akcjach (`docs/FRONTEND.md`, sekcja 14).
 * Wszystkie komunikaty są po polsku, bo trafiają prosto pod pole formularza.
 */

export const personName = z
  .string()
  .trim()
  .min(3, "Podaj imię i nazwisko.")
  .max(80, "Imię i nazwisko może mieć najwyżej 80 znaków.")

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, "Adres e-mail jest za długi.")
  .pipe(z.email("Podaj poprawny adres e-mail."))

export const optionalEmail = z
  .string()
  .trim()
  .max(120, "Adres e-mail jest za długi.")
  .transform((value) => value.toLowerCase() || null)
  .refine(
    (value) => value === null || z.email().safeParse(value).success,
    "Podaj poprawny adres e-mail."
  )

/** Polski numer w dowolnym zapisie: spacje, myślniki i prefiks +48 przechodzą. */
export const phone = z
  .string()
  .trim()
  .min(9, "Podaj numer telefonu — bez niego nie potwierdzimy terminu.")
  .max(20, "Numer telefonu jest za długi.")
  .refine(
    (value) => /^\+?[\d\s-]{9,20}$/.test(value),
    "Numer telefonu może zawierać tylko cyfry, spacje i myślniki."
  )

export const optionalPhone = z
  .string()
  .trim()
  .max(20, "Numer telefonu jest za długi.")
  .transform((value) => value || null)
  .refine(
    (value) => value === null || /^\+?[\d\s-]{9,20}$/.test(value),
    "Numer telefonu może zawierać tylko cyfry, spacje i myślniki."
  )

export const message = z
  .string()
  .trim()
  .min(10, "Napisz choć zdanie — inaczej trudno nam pomóc.")
  .max(2000, "Wiadomość może mieć najwyżej 2000 znaków.")

export const shortNote = z
  .string()
  .trim()
  .max(500, "Notatka może mieć najwyżej 500 znaków.")
  .transform((value) => value || null)

/** Zgoda na przetwarzanie danych — pole wymagane przy każdym formularzu. */
export const consent = z
  .boolean()
  .refine((value) => value, "Bez zgody na kontakt nie możemy odpowiedzieć.")

export const cuid = z.string().trim().min(1).max(40)

export const optionalId = z
  .string()
  .trim()
  .max(40)
  .transform((value) => value || null)

/** Data jako ściana zegara: "2026-08-27". Bez stref — te psują początek dnia. */
export const dayString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowa data.")

/** Godzina jako ściana zegara: "17:00". */
export const timeString = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "Nieprawidłowa godzina.")

/** Kod rezerwacji albo zapisu, np. „KOR-7H3D". Wielkość liter bez znaczenia. */
export const referenceCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}-[A-Z0-9]{4,8}$/, "Nieprawidłowy kod.")

export type FieldErrors = Record<string, string>

/**
 * Wynik akcji publicznej. Nie rzucamy wyjątkiem: panelowy `useServerAction()`
 * pokazuje jeden komunikat na całą operację, a formularz na stronie musi umieć
 * podświetlić konkretne pole.
 */
export type ActionResult<T> =
  | ({ ok: true } & T)
  | { ok: false; errors: FieldErrors; message?: string }

/** Pierwszy błąd na pole — formularz i tak pokazuje po jednym pod polem. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_"
    if (!(key in result)) result[key] = issue.message
  }
  return result
}

export function fail(errors: FieldErrors, message?: string) {
  return { ok: false as const, errors, message }
}

/** Błąd niezwiązany z żadnym polem — ląduje nad przyciskiem wysyłki. */
export function failWith(message: string) {
  return { ok: false as const, errors: { _: message }, message }
}

/** Wspólny początek każdej akcji publicznej: parsuj albo wróć z błędami pól. */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown) {
  const parsed = schema.safeParse(input)
  if (parsed.success) return { ok: true as const, data: parsed.data as z.infer<S> }
  return { ok: false as const, errors: fieldErrors(parsed.error) }
}
