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
    <svg
      aria-hidden
      viewBox="0 0 96 64"
      fill="none"
      className={className}
    >
      <path
        d="M6 8c22 2 42 14 52 34"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M45 38.5c5 1.5 10 2.5 13 3.5-1.5 3-3 8-4 13"
        stroke="currentColor"
        strokeWidth={3}
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
