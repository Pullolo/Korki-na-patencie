// Odręczne akcenty: jedna grubość kreski, zaokrąglone końce, kolor z
// `currentColor`. Rysowane statycznie — animacja „rysowania się" potrafiła nie
// wystartować w karcie, która nie renderuje klatek, i akcent znikał zupełnie.

export function Squiggle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 16"
      preserveAspectRatio="none"
      fill="none"
      className={className}
    >
      <path
        d="M4 11.5c26-8 52 4 78-1.5s52-9 78-2.5 52 6 76 1"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ArrowDoodle({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 96 64" fill="none" className={className}>
      {/* Łuk w dół-w prawo, grot „V" zbiegający się w ostrzu na jego końcu. */}
      <path
        d="M8 6c22 4 38 18 50 42"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path
        d="M61 32.5 58 48l-13.5-8.5"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2.5c.8 5 3.7 7.9 8.7 8.7-5 .8-7.9 3.7-8.7 8.7-.8-5-3.7-7.9-8.7-8.7 5-.8 7.9-3.7 8.7-8.7Z"
        fill="currentColor"
      />
    </svg>
  )
}
