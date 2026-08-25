"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

import { canAccessDashboard, requireAdmin } from "@/lib/auth"
import { plural } from "@/lib/format"
import { UserRole } from "@/lib/generated/prisma/enums"
import { notify } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function uniqueSlug(base: string) {
  const root = base || "nauczyciel"
  let candidate = root
  let suffix = 2
  while (
    await prisma.teacherProfile.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${root}-${suffix++}`
  }
  return candidate
}

/**
 * Profil nauczyciela jest niezależny od roli — zakładamy go tak samo dla
 * nauczyciela (automatycznie, z roli) jak i dla admina (ręcznie).
 */
async function createTeacherProfile(user: {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}) {
  const base = slugify(
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email.split("@")[0]
  )
  return prisma.teacherProfile.create({
    data: { userId: user.id, slug: await uniqueSlug(base) },
  })
}

export async function updateUserRole(userId: string, role: UserRole) {
  const admin = await requireAdmin()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      teacherProfile: { select: { id: true } },
    },
  })
  if (!user) throw new Error("Nie znaleziono użytkownika.")

  // Bez tego admin mógłby odebrać sobie dostęp i zamknąć się poza panelem.
  if (user.id === admin.userId) {
    throw new Error("Nie możesz zmienić własnej roli.")
  }

  if (user.clerkId) {
    const client = await clerkClient()
    await client.users.updateUser(user.clerkId, {
      publicMetadata: { role },
    })
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } })

  // Nauczyciel bez profilu nie miałby czego pokazać w panelu, więc zakładamy szkic.
  // Admin dostaje profil dopiero wtedy, gdy sam o niego poprosi — patrz
  // `setTeacherProfile()`. Istniejącego profilu zmiana roli nigdy nie kasuje.
  if (role === UserRole.TEACHER && !user.teacherProfile) {
    await createTeacherProfile(user)
  }

  // Uczeń nie prowadzi zajęć, więc jego dawny profil znika z frontu — ale danych
  // nie kasujemy, bo wiszą na nich rezerwacje i historia.
  if (role === UserRole.STUDENT && user.teacherProfile) {
    await prisma.teacherProfile.update({
      where: { id: user.teacherProfile.id },
      data: { isPublished: false, isAcceptingStudents: false },
    })
  }

  if (role !== UserRole.STUDENT) {
    await notify({
      type: "SYSTEM",
      title:
        role === UserRole.ADMIN
          ? "Masz teraz uprawnienia administratora"
          : "Masz teraz profil nauczyciela",
      message:
        role === UserRole.TEACHER
          ? "Uzupełnij grafik w sekcji Moja dostępność, żeby uczniowie mogli się zapisywać."
          : undefined,
      link: role === UserRole.TEACHER ? "/dashboard/dostepnosc" : "/dashboard",
      userId: user.id,
    })
  }

  revalidatePath("/dashboard/uzytkownicy")
  revalidatePath("/dashboard/nauczyciele")
  return { ok: true }
}

/**
 * Włącza albo wyłącza profil nauczyciela bez ruszania roli — dzięki temu admin
 * może sam prowadzić zajęcia, ale nie musi. Rola `TEACHER` profilu wymaga,
 * więc tam wyłączenie jest zablokowane.
 */
export async function setTeacherProfile(userId: string, enabled: boolean) {
  await requireAdmin()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      teacherProfile: {
        select: {
          id: true,
          _count: {
            select: { bookings: true, courseGroups: true, reviews: true },
          },
        },
      },
    },
  })
  if (!user) throw new Error("Nie znaleziono użytkownika.")

  if (enabled) {
    if (!canAccessDashboard(user.role)) {
      throw new Error(
        "Profil nauczyciela może mieć tylko administrator albo nauczyciel."
      )
    }
    if (!user.teacherProfile) {
      await createTeacherProfile(user)
      await notify({
        type: "SYSTEM",
        title: "Masz teraz profil nauczyciela",
        message:
          "Uzupełnij grafik w sekcji Moja dostępność, żeby uczniowie mogli się zapisywać.",
        link: "/dashboard/dostepnosc",
        userId: user.id,
      })
    }
  } else if (user.teacherProfile) {
    if (user.role === UserRole.TEACHER) {
      throw new Error(
        "Nauczyciel musi mieć profil — najpierw zmień rolę na inną."
      )
    }

    // Usunięcie profilu kaskadowo zabrałoby też rezerwacje i grupy, więc
    // wolno je skasować dopiero, gdy nic się do niego nie odwołuje.
    const counts = user.teacherProfile._count
    const blockers: string[] = []
    if (counts.bookings) {
      blockers.push(
        `${counts.bookings} ${plural(counts.bookings, "rezerwacja", "rezerwacje", "rezerwacji")}`
      )
    }
    if (counts.courseGroups) {
      blockers.push(
        `${counts.courseGroups} ${plural(counts.courseGroups, "grupa", "grupy", "grup")}`
      )
    }
    if (counts.reviews) {
      blockers.push(
        `${counts.reviews} ${plural(counts.reviews, "opinia", "opinie", "opinii")}`
      )
    }
    if (blockers.length > 0) {
      throw new Error(
        `Nie można usunąć profilu — powiązane dane: ${blockers.join(", ")}.`
      )
    }

    await prisma.teacherProfile.delete({ where: { id: user.teacherProfile.id } })
  }

  revalidatePath("/dashboard/uzytkownicy")
  revalidatePath("/dashboard/nauczyciele")
  return { ok: true }
}
