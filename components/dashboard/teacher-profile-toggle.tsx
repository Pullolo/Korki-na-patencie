"use client"

import { GraduationCap, Trash2 } from "lucide-react"
import Link from "next/link"

import { ActionButton } from "@/components/dashboard/action-button"
import { FormError } from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import { setTeacherProfile } from "@/lib/actions/users"
import { UserRole } from "@/lib/generated/prisma/enums"

/**
 * Profil nauczyciela nie wynika z roli — admin może prowadzić zajęcia, ale nie
 * musi. Dla roli `TEACHER` profil jest obowiązkowy, więc pokazujemy go bez akcji.
 */
export function TeacherProfileToggle({
  userId,
  role,
  profileId,
}: {
  userId: string
  role: UserRole
  profileId: string | null
}) {
  const { pending, error, run } = useServerAction()

  if (role === UserRole.STUDENT) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {profileId && (
          <Link
            href={`/dashboard/nauczyciele/${profileId}`}
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Zobacz profil
          </Link>
        )}
        {role === UserRole.TEACHER ? (
          <span className="text-xs text-muted-foreground">wymagany rolą</span>
        ) : (
          <ActionButton
            pending={pending}
            variant={profileId ? "danger" : "ghost"}
            icon={
              profileId ? (
                <Trash2 className="size-3.5" />
              ) : (
                <GraduationCap className="size-3.5" />
              )
            }
            title={
              profileId
                ? "Usuwa profil razem z grafikiem, lokalizacjami i cennikiem tego nauczyciela."
                : "Zakłada profil nauczyciela bez zmiany roli."
            }
            onClick={() => run(() => setTeacherProfile(userId, !profileId))}
          >
            {profileId ? "Usuń profil" : "Nadaj profil"}
          </ActionButton>
        )}
      </div>
      <FormError message={error} />
    </div>
  )
}
