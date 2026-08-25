"use client"

import { Check, Search, UserPlus, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Field, inputClass } from "@/components/dashboard/form-controls"
import { searchStudents, type StudentMatch } from "@/lib/actions/students"
import { personName } from "@/lib/format"
import { cn } from "@/lib/utils"

export type StudentValue = {
  /** Ustawione po wybraniu kogoś z listy; puste = nowa osoba. */
  studentId: string | null
  name: string
  phone: string
  email: string
}

export const EMPTY_STUDENT: StudentValue = {
  studentId: null,
  name: "",
  phone: "",
  email: "",
}

function contactLine(student: StudentMatch) {
  return [student.email, student.phone].filter(Boolean).join(" · ")
}

/**
 * Jedno pole na ucznia: wpisujesz nazwisko, dostajesz podpowiedzi z bazy,
 * a jak nikogo takiego jeszcze nie ma — ta sama wartość zakłada nową osobę.
 * Dzięki temu umówienie kogoś przez telefon nie wymaga wcześniejszego
 * zakładania konta ani osobnego kroku „najpierw dodaj ucznia".
 */
export function StudentPicker({
  value,
  onChange,
  disabled,
}: {
  value: StudentValue
  onChange: (next: StudentValue) => void
  disabled?: boolean
}) {
  const [matches, setMatches] = useState<StudentMatch[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  // Odpowiedzi potrafią wrócić nie po kolei — liczy się tylko ostatnie zapytanie.
  const queryRef = useRef("")

  const query = value.studentId ? "" : value.name.trim()

  useEffect(() => {
    queryRef.current = query
    if (query.length < 2) return

    // Cały stan ustawiamy dopiero w timerze — synchroniczny setState w ciele
    // efektu jest i zbędnym renderem, i błędem według reguł React.
    const timer = setTimeout(() => {
      setSearching(true)
      searchStudents(query)
        .then((found) => {
          if (queryRef.current !== query) return
          setMatches(found)
          setOpen(true)
        })
        .catch(() => setMatches([]))
        .finally(() => {
          if (queryRef.current === query) setSearching(false)
        })
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const isNew = !value.studentId && value.name.trim().length > 0
  // Podpowiedzi z poprzedniego zapytania mogą jeszcze siedzieć w stanie —
  // pokazujemy je tylko wtedy, gdy pasują do tego, co jest w polu.
  const showMatches = open && query.length >= 2 && matches.length > 0

  return (
    <div className="space-y-3">
      <Field
        label="Uczeń"
        hint={
          value.studentId
            ? "Uczeń z listy — lekcja dopisze się do jego historii."
            : isNew
              ? "Nowa osoba — dodamy ją do listy uczniów, konto nie jest potrzebne."
              : "Wpisz imię i nazwisko — podpowiemy osoby, które już u nas były."
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={value.name}
            disabled={disabled}
            autoComplete="off"
            placeholder="np. Jan Kowalski"
            onChange={(event) =>
              onChange({ ...value, studentId: null, name: event.target.value })
            }
            onFocus={() => matches.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
            className={cn(inputClass, "pl-8")}
          />
          {value.studentId && (
            <button
              type="button"
              onClick={() => onChange({ ...EMPTY_STUDENT })}
              title="Wyczyść wybór"
              aria-label="Wyczyść wybór ucznia"
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}

          {showMatches && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
              {matches.map((student) => (
                <li key={student.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({
                        studentId: student.id,
                        name: personName(student),
                        phone: student.phone ?? "",
                        email: student.email ?? "",
                      })
                      setOpen(false)
                    }}
                    className="flex w-full cursor-pointer flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <span className="text-sm text-foreground">
                      {personName(student)}
                    </span>
                    {contactLine(student) && (
                      <span className="text-[11px] text-muted-foreground">
                        {contactLine(student)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Field>

      {value.studentId ? (
        <p className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
          <Check className="size-3.5" />
          Wybrano ucznia z listy
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Telefon" hint="opcjonalnie">
            <input
              type="tel"
              value={value.phone}
              disabled={disabled}
              placeholder="+48 500 100 200"
              onChange={(event) =>
                onChange({ ...value, phone: event.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label="E-mail" hint="potrzebny dopiero przy zakładaniu konta">
            <input
              type="email"
              value={value.email}
              disabled={disabled}
              placeholder="jan@example.com"
              onChange={(event) =>
                onChange({ ...value, email: event.target.value })
              }
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {isNew && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <UserPlus className="size-3.5" />
          {searching ? "Szukam w bazie…" : `Nowy uczeń: ${value.name.trim()}`}
        </p>
      )}
    </div>
  )
}
