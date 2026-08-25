// Wspólne klasy strony publicznej. Front nie używa `ui/button` z panelu — tamten
// komponent jest skalowany pod gęstą siatkę dashboardu (h-7), a tu przyciski
// muszą być duże i wciskane, w standardzie produktów edukacyjnych.

export const btnPrimary =
  "inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-front-brand px-7 font-body text-base font-bold text-white shadow-[0_4px_0_0_var(--color-front-brand-dark),0_14px_26px_-14px_rgba(68,50,194,0.8)] transition-[transform,box-shadow,background-color] duration-150 hover:bg-[#6a58ea] active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-front-brand-dark),0_8px_16px_-12px_rgba(68,50,194,0.8)] disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-5 [&_svg]:shrink-0"

export const btnSecondary =
  "inline-flex h-13 items-center justify-center gap-2 rounded-2xl border-2 border-front-line bg-front-surface px-7 font-body text-base font-bold text-front-ink shadow-[0_4px_0_0_#e8e6f4] transition-[transform,box-shadow,border-color] duration-150 hover:border-[#d6d2ee] active:translate-y-[3px] active:shadow-[0_1px_0_0_#e8e6f4] [&_svg]:size-5 [&_svg]:shrink-0"

export const btnSmall =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 font-body text-sm font-bold transition-colors duration-150 [&_svg]:size-4 [&_svg]:shrink-0"

export const chip =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-sm font-semibold"

export const cardBase =
  "rounded-3xl border border-front-line bg-front-surface shadow-[0_18px_40px_-28px_rgba(26,24,48,0.45)]"

/** Znacznik treści-zaślepki. Wszystko, co nim opatrzone, czeka na prawdziwe dane. */
export const sampleTag =
  "inline-flex items-center rounded-full bg-front-brand-soft px-2.5 py-0.5 font-body text-xs font-bold tracking-wide text-front-brand uppercase"
