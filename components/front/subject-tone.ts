/**
 * Kolory pomocnicze niosą kategorię, nie nastrój (`DESIGN.md`,
 * Meaning-Not-Mood Rule). Przedmiot dostaje kolor z kolejności w panelu
 * i trzyma go przez całą stronę: w kartach, w wyborze terminu i na profilu
 * nauczyciela. Czwarty przedmiot bierze koral — kolor zarezerwowany
 * dokładnie na taki moment.
 */
export type SubjectTone = {
  /** Nazwa tokenu, do debugowania i do zapisu w DESIGN.md. */
  name: string
  /** Mgliste tło + nasycony tekst — chip, kafelek ikony. */
  soft: string
  /** Sam kolor tekstu i ikon. */
  text: string
  /** Pierścień wokół wybranego kafelka. */
  ring: string
}

export const SUBJECT_TONES: SubjectTone[] = [
  {
    name: "winogron",
    soft: "bg-front-brand-soft text-front-brand",
    text: "text-front-brand",
    ring: "ring-front-brand",
  },
  {
    name: "błękit",
    soft: "bg-front-sky-soft text-front-sky",
    text: "text-front-sky",
    ring: "ring-front-sky",
  },
  {
    name: "mięta",
    soft: "bg-front-mint-soft text-front-mint",
    text: "text-front-mint",
    ring: "ring-front-mint",
  },
  {
    name: "koral",
    soft: "bg-front-coral-soft text-front-coral",
    text: "text-front-coral",
    ring: "ring-front-coral",
  },
]

export function subjectTone(index: number) {
  return SUBJECT_TONES[index % SUBJECT_TONES.length]
}
