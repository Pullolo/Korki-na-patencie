"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth"
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
  if (role === UserRole.TEACHER && !user.teacherProfile) {
    const base = slugify(
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.email.split("@")[0]
    )
    await prisma.teacherProfile.create({
      data: { userId: user.id, slug: await uniqueSlug(base) },
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
