import { groupMeetingsInRange } from "@/lib/availability"
import { formatTime, studentLabel } from "@/lib/format"
import type { BookingStatus } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

/**
 * Klient Prismy albo uchwyt transakcji. Sprawdzenie kolizji musi umieć
 * czytać **wewnątrz** transakcji, która zaraz zapisze rezerwację — inaczej
 * patrzy na stan sprzed blokady i cała ochrona przed wyścigiem znika.
 */
type PrismaLike = Pick<typeof prisma, "booking" | "courseGroup">

/**
 * Jedno miejsce, w którym sprawdzamy, czy termin jest wolny.
 *
 * Grafik nauczyciela zajmują dwie różne rzeczy: rezerwacje (wiersze w bazie)
 * i spotkania grup (rozwijane z cyklicznego terminu). Kto sprawdza tylko
 * rezerwacje, ten pozwoli zapisać ucznia na godzinę, w której nauczyciel
 * prowadzi grupę — dlatego pytamy o oba naraz.
 */

export type ScheduleConflict = {
  kind: "booking" | "group"
  label: string
  startsAt: Date
  endsAt: Date
}

/** Domyślnie: potwierdzona lekcja blokuje termin, oczekująca prośba jeszcze nie. */
const BLOCKING_STATUSES: BookingStatus[] = ["CONFIRMED"]

function startOfDay(date: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day
}

export async function findScheduleConflicts({
  teacherProfileId,
  startsAt,
  endsAt,
  statuses = BLOCKING_STATUSES,
  ignoreBookingId,
  client = prisma,
}: {
  teacherProfileId: string
  startsAt: Date
  endsAt: Date
  statuses?: BookingStatus[]
  ignoreBookingId?: string
  /** Uchwyt transakcji; domyślnie zwykły klient. */
  client?: PrismaLike
}): Promise<ScheduleConflict[]> {
  const bookings = await client.booking.findMany({
    where: {
      teacherProfileId,
      status: { in: statuses },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(ignoreBookingId ? { id: { not: ignoreBookingId } } : {}),
    },
    select: {
      reference: true,
      startsAt: true,
      endsAt: true,
      guestName: true,
      student: { select: { firstName: true, lastName: true, email: true } },
    },
  })

  const conflicts: ScheduleConflict[] = bookings.map((booking) => ({
    kind: "booking" as const,
    label: `${booking.reference} · ${studentLabel(booking)}`,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
  }))

  // Spotkania grup żyją w cyklicznym terminie, więc rozwijamy dobę wokół lekcji.
  // Dwa dni, bo lekcja może się zacząć wieczorem i przejść przez północ.
  const groups = await client.courseGroup.findMany({
    where: { teacherProfileId, isActive: true },
    select: {
      name: true,
      weekday: true,
      startMin: true,
      meetingMinutes: true,
      startsOn: true,
      endsOn: true,
      isActive: true,
    },
  })

  for (const group of groups) {
    for (const meeting of groupMeetingsInRange(
      [group],
      startOfDay(startsAt),
      2
    )) {
      if (meeting.startsAt >= endsAt || meeting.endsAt <= startsAt) continue
      conflicts.push({
        kind: "group",
        label: `${group.name} (grupa)`,
        startsAt: meeting.startsAt,
        endsAt: meeting.endsAt,
      })
    }
  }

  return conflicts
}

/** Komunikat pod formularz: „Termin koliduje z: KOR-12AB · Jan Kowalski (17:00–18:00)". */
export function conflictMessage(conflicts: ScheduleConflict[]) {
  const list = conflicts
    .map(
      (conflict) =>
        `${conflict.label} (${formatTime(conflict.startsAt)}–${formatTime(conflict.endsAt)})`
    )
    .join(", ")
  return `Termin koliduje z: ${list}.`
}
