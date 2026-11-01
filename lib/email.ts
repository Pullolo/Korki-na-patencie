import { absoluteUrl } from "@/lib/seo"

/**
 * Maile transakcyjne.
 *
 * Do tej pory całe potwierdzenie żyło na ekranie: uczeń dostawał kod
 * rezerwacji, zamykał kartę i tracił jedyny dostęp do swojego zgłoszenia,
 * a nauczyciel dowiadywał się o nowej lekcji dopiero po wejściu do panelu.
 * Dla serwisu, który obiecuje „zapisz się w minutę", to była największa
 * dziura w obsłudze — większa niż brak płatności.
 *
 * Warstwa jest celowo cienka: jeden `fetch` do API dostawcy, zero zależności,
 * zero szablonów w HTML-u wymagających budowania. Zamiana Resenda na inną
 * usługę to podmiana jednej funkcji `deliver()`.
 *
 * **Bez `RESEND_API_KEY` moduł nic nie wysyła i nikomu nie przeszkadza** —
 * lokalnie wypisuje temat do konsoli i zwraca `false`. Dzięki temu brak
 * konfiguracji nigdy nie wywraca rezerwacji: mail jest dodatkiem do zapisu
 * w bazie, nie warunkiem jego powodzenia.
 */

const API = "https://api.resend.com/emails"

function config() {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) return null
  return { key, from }
}

export function emailEnabled() {
  return config() !== null
}

type Message = {
  to: string
  subject: string
  /** Treść w zwykłym tekście — jedyne źródło prawdy, HTML jest z niej złożony. */
  body: string
}

function toHtml(body: string) {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  const paragraphs = escaped
    .trim()
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 16px">${block.replace(/\n/g, "<br>")}</p>`
    )
    .join("")

  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:16px;line-height:1.6;color:#1c1b22;max-width:32rem">${paragraphs}</div>`
}

/**
 * Wysyłka nigdy nie rzuca. Wołający jest w środku akcji, która zapisała już
 * rezerwację — wywrócenie jej z powodu nieodebranego maila byłoby gorsze
 * od samego braku maila.
 */
export async function sendEmail(message: Message): Promise<boolean> {
  const settings = config()
  if (!settings) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[mail pominięty: brak RESEND_API_KEY] → ${message.to}: ${message.subject}`
      )
    }
    return false
  }

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: settings.from,
        to: [message.to],
        subject: message.subject,
        text: message.body,
        html: toHtml(message.body),
      }),
    })

    if (!response.ok) {
      console.error(
        `Nie udało się wysłać maila (${response.status}):`,
        await response.text().catch(() => "")
      )
      return false
    }
    return true
  } catch (error) {
    console.error("Nie udało się wysłać maila:", error)
    return false
  }
}

// ─── Treści ───────────────────────────────────────────────────────────────────

type BookingMail = {
  reference: string
  dayLabel: string
  timeLabel: string
  teacherName: string
  subjectName: string | null
  siteName: string
}

function lessonLine(booking: BookingMail) {
  return `${booking.dayLabel}, ${booking.timeLabel} · ${booking.teacherName}${
    booking.subjectName ? ` · ${booking.subjectName}` : ""
  }`
}

/** Do ucznia zaraz po wysłaniu formularza. Zawiera jedyny link do zgłoszenia. */
export function bookingReceivedMail(
  booking: BookingMail & { studentName: string }
) {
  return {
    subject: `Mamy Twoje zgłoszenie — ${booking.reference}`,
    body: `Cześć ${booking.studentName.split(" ")[0]}!

Zapisaliśmy Twoje zgłoszenie na lekcję:
${lessonLine(booking)}

Termin jest już zablokowany — nikt inny go nie zajmie. Czekamy tylko na potwierdzenie nauczyciela; odezwiemy się mailem, gdy tylko podejmie decyzję.

Status sprawdzisz w każdej chwili tutaj:
${absoluteUrl(`/rezerwacja/${booking.reference}`)}

Pod tym samym adresem możesz lekcję odwołać. Zachowaj ten mail — to Twój jedyny dostęp do zgłoszenia.

Do zobaczenia,
${booking.siteName}`,
  }
}

/** Do nauczyciela — inaczej dowie się o lekcji dopiero po wejściu do panelu. */
export function bookingForTeacherMail(
  booking: BookingMail & {
    studentName: string
    phone: string | null
    note: string | null
  }
) {
  return {
    subject: `Nowe zgłoszenie: ${booking.dayLabel}, ${booking.timeLabel}`,
    body: `Nowe zgłoszenie ze strony — czeka na Twoją decyzję.

${lessonLine(booking)}
Uczeń: ${booking.studentName}${booking.phone ? ` · tel. ${booking.phone}` : ""}
${booking.note ? `\nWiadomość od ucznia:\n${booking.note}\n` : ""}
Potwierdź albo odrzuć w panelu:
${absoluteUrl("/dashboard/rezerwacje")}`,
  }
}

/** Do ucznia po decyzji nauczyciela — potwierdzenie, odrzucenie albo odwołanie. */
export function bookingDecisionMail(
  booking: BookingMail & {
    decision: "CONFIRMED" | "REJECTED" | "CANCELLED"
    reason: string | null
  }
) {
  const reason = booking.reason ? `\n\nPowód: ${booking.reason}` : ""

  if (booking.decision === "CONFIRMED") {
    return {
      subject: `Termin potwierdzony — ${booking.dayLabel}, ${booking.timeLabel}`,
      body: `Dobra wiadomość: nauczyciel potwierdził Twój termin.

${lessonLine(booking)}

Płacisz po lekcji. Gdyby coś wypadło, odwołasz ją tutaj:
${absoluteUrl(`/rezerwacja/${booking.reference}`)}

Do zobaczenia,
${booking.siteName}`,
    }
  }

  return {
    subject:
      booking.decision === "REJECTED"
        ? `Nie damy rady w tym terminie — ${booking.reference}`
        : `Lekcja odwołana — ${booking.reference}`,
    body: `${
      booking.decision === "REJECTED"
        ? "Niestety nauczyciel nie może poprowadzić tej lekcji."
        : "Ta lekcja została odwołana."
    }

${lessonLine(booking)}${reason}

Wolne terminy — także u innych nauczycieli — znajdziesz tutaj:
${absoluteUrl("/terminy")}

${booking.siteName}`,
  }
}

/** Do ucznia po zapisie do grupy. */
export function enrollmentMail(input: {
  reference: string
  studentName: string
  groupName: string
  waitlisted: boolean
  siteName: string
}) {
  return {
    subject: input.waitlisted
      ? `Jesteś na liście rezerwowej — ${input.groupName}`
      : `Zapisaliśmy Cię do grupy — ${input.groupName}`,
    body: `Cześć ${input.studentName.split(" ")[0]}!

${
  input.waitlisted
    ? `Wszystkie miejsca w grupie „${input.groupName}" są w tej chwili zajęte, więc Twój zapis czeka na liście rezerwowej. Odezwiemy się, gdy któreś się zwolni.`
    : `Miejsce w grupie „${input.groupName}" jest Twoje. Szczegóły pierwszego spotkania podeślemy osobno.`
}

Status zapisu sprawdzisz tutaj:
${absoluteUrl(`/zapis/${input.reference}`)}

${input.siteName}`,
  }
}
