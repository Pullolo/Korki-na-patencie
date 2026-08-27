import { toDateOnly } from "@/lib/dates"
import { applyDiscount } from "@/lib/pricing"
import { prisma } from "@/lib/prisma"
import { uniqueEnrollmentReference } from "@/lib/reference"

/**
 * Wspólna logika zapisu do grupy.
 *
 * Zapisać ucznia można z dwóch stron: nauczyciel w panelu i uczeń przez
 * formularz na stronie. Bramka autoryzacji jest w każdej z nich inna, ale
 * reguły — rabat, limit miejsc, lista rezerwowa i migawka ceny — muszą być
 * jedne. Inaczej rabat zacznie żyć w dwóch miejscach i rozjedzie się przy
 * pierwszej zmianie ustawień.
 */

export type EnrollmentInput = {
  studentId: string | null
  guestName: string | null
  guestEmail: string | null
  guestPhone: string | null
  note: string | null
}

export type EnrollmentResult = {
  id: string
  reference: string
  waitlisted: boolean
  discountPercent: number
  monthlyPrice: number
}

export class EnrollmentError extends Error {}

/**
 * Rabat należy się uczniom, którzy mają u nas zajęcia indywidualne.
 * Liczymy go w chwili zapisu i zapisujemy jako migawkę razem z ceną —
 * późniejsza zmiana cennika nie przelicza wstecz.
 */
export async function groupDiscountFor(studentId: string | null) {
  if (!studentId) return 0

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "settings" },
    select: { groupDiscountPercent: true },
  })
  const percent = settings?.groupDiscountPercent ?? 0
  if (percent <= 0) return 0

  const individual = await prisma.booking.findFirst({
    where: { studentId, status: { in: ["CONFIRMED", "COMPLETED"] } },
    select: { id: true },
  })
  return individual ? percent : 0
}

export async function enrollStudent(
  groupId: string,
  input: EnrollmentInput,
  options: { requirePublished?: boolean } = {}
): Promise<EnrollmentResult> {
  const group = await prisma.courseGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      isActive: true,
      isPublished: true,
      maxSeats: true,
      pricePerMonth: true,
    },
  })
  if (!group) throw new EnrollmentError("Nie znaleziono grupy.")

  if (options.requirePublished && (!group.isPublished || !group.isActive)) {
    throw new EnrollmentError("Do tej grupy nie da się teraz zapisać.")
  }

  if (!input.studentId && !input.guestName?.trim()) {
    throw new EnrollmentError("Wskaż ucznia z konta albo podaj imię i nazwisko.")
  }

  if (input.studentId) {
    const existing = await prisma.groupEnrollment.findUnique({
      where: { groupId_studentId: { groupId, studentId: input.studentId } },
      select: { id: true },
    })
    if (existing) {
      throw new EnrollmentError("Ten uczeń jest już zapisany do tej grupy.")
    }
  }

  const discountPercent = await groupDiscountFor(input.studentId)
  const monthlyPrice = applyDiscount(group.pricePerMonth, discountPercent)
  const reference = await uniqueEnrollmentReference()

  // Liczbę miejsc sprawdzamy w tej samej transakcji, w której zapisujemy —
  // inaczej dwa równoczesne zgłoszenia zmieściłyby się w ostatnim wolnym.
  const created = await prisma.$transaction(async (tx) => {
    const taken = await tx.groupEnrollment.count({
      where: { groupId, status: "ACTIVE" },
    })
    const full = taken >= group.maxSeats

    const row = await tx.groupEnrollment.create({
      data: {
        reference,
        groupId,
        studentId: input.studentId,
        guestName: input.guestName?.trim() || null,
        guestEmail: input.guestEmail?.trim() || null,
        guestPhone: input.guestPhone?.trim() || null,
        // Po przekroczeniu limitu zapisujemy na listę rezerwową, nie odmawiamy.
        status: full ? "WAITLIST" : "ACTIVE",
        discountPercent,
        monthlyPrice,
        startedOn: toDateOnly(new Date()),
        note: input.note?.trim() || null,
      },
      select: { id: true, reference: true, status: true },
    })

    return { id: row.id, waitlisted: row.status === "WAITLIST" }
  })

  return {
    id: created.id,
    reference,
    waitlisted: created.waitlisted,
    discountPercent,
    monthlyPrice,
  }
}
