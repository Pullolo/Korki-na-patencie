"use client"

import { Loader2 } from "lucide-react"
import { useState } from "react"

import { inputClass } from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import { updateUserRole } from "@/lib/actions/users"
import { UserRole } from "@/lib/generated/prisma/enums"
import { USER_ROLE_LABELS } from "@/lib/labels"

export function RoleSelect({
  userId,
  role,
  disabled,
  disabledHint,
}: {
  userId: string
  role: UserRole
  disabled?: boolean
  disabledHint?: string
}) {
  const { pending, error, run } = useServerAction()
  const [value, setValue] = useState<UserRole>(role)

  if (disabled) {
    return (
      <span className="text-xs text-muted-foreground" title={disabledHint}>
        {USER_ROLE_LABELS[role]}
      </span>
    )
  }

  function onChange(next: UserRole) {
    const previous = value
    // Select pokazuje nową rolę od razu; przy błędzie wraca do poprzedniej.
    setValue(next)
    run(
      () => updateUserRole(userId, next),
      undefined,
      () => setValue(previous)
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        disabled={pending}
        onChange={(event) => onChange(event.target.value as UserRole)}
        className={`${inputClass} w-auto cursor-pointer px-2 py-1 text-xs`}
      >
        {Object.values(UserRole).map((option) => (
          <option key={option} value={option}>
            {USER_ROLE_LABELS[option]}
          </option>
        ))}
      </select>
      {pending && (
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
