"use server"

import { revalidatePath } from "next/cache"

import { requireTeacherAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function loadBookingForUpdate(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      teacherProfileId: true,
      status: true,
      startsAt: true,
      endsAt: true,
    },
  })
  if (!booking) throw new Error("Nie znaleziono rezerwacji.")
  // Nauczyciel może ruszać tylko swoje rezerwacje, admin wszystkie.
  await requireTeacherAccess(booking.teacherProfileId)
  return booking
}

function refresh(bookingId?: string) {
  if (bookingId) revalidatePath(`/dashboard/rezerwacje/${bookingId}`)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/rezerwacje")
  revalidatePath("/dashboard/kalendarz")
}

export async function confirmBooking(bookingId: string) {
  const booking = await loadBookingForUpdate(bookingId)

  // Dwie rezerwacje na ten sam termin u tego samego nauczyciela to realny scenariusz,
  // bo do potwierdzenia termin nikomu nie jest zablokowany.
  const conflict = await prisma.booking.findFirst({
    where: {
      id: { not: booking.id },
      teacherProfileId: booking.teacherProfileId,
      status: "CONFIRMED",
      startsAt: { lt: booking.endsAt },
      endsAt: { gt: booking.startsAt },
    },
    select: { reference: true },
  })
  if (conflict) {
    throw new Error(
      `Termin koliduje z potwierdzoną rezerwacją ${conflict.reference}.`
    )
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", confirmedAt: new Date(), statusReason: null },
  })
  refresh(booking.id)
}

export async function rejectBooking(bookingId: string, reason?: string) {
  const booking = await loadBookingForUpdate(bookingId)
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "REJECTED", statusReason: reason || null },
  })
  refresh(booking.id)
}

export async function cancelBooking(bookingId: string, reason?: string) {
  const booking = await loadBookingForUpdate(bookingId)
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      statusReason: reason || null,
    },
  })
  refresh(booking.id)
}

export async function completeBooking(bookingId: string) {
  const booking = await loadBookingForUpdate(bookingId)
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "COMPLETED" },
  })
  refresh(booking.id)
}

export async function markNoShow(bookingId: string) {
  const booking = await loadBookingForUpdate(bookingId)
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "NO_SHOW" },
  })
  refresh(booking.id)
}

export async function updateInternalNote(bookingId: string, note: string) {
  const booking = await loadBookingForUpdate(bookingId)
  await prisma.booking.update({
    where: { id: booking.id },
    data: { internalNote: note.trim() || null },
  })
  revalidatePath(`/dashboard/rezerwacje/${booking.id}`)
}

/** Cofnięcie decyzji — rezerwacja wraca do kolejki oczekujących. */
export async function reopenBooking(bookingId: string) {
  const booking = await loadBookingForUpdate(bookingId)
  if (booking.status === "PENDING") return

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "PENDING",
      confirmedAt: null,
      cancelledAt: null,
      statusReason: null,
    },
  })
  refresh()
  revalidatePath(`/dashboard/rezerwacje/${booking.id}`)
}
