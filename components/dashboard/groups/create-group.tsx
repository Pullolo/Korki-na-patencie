"use client"

import { Plus } from "lucide-react"
import { useState } from "react"

import { ActionButton } from "@/components/dashboard/action-button"
import {
  EMPTY_GROUP,
  GroupForm,
  type GroupFormOptions,
} from "@/components/dashboard/groups/group-form"
import { useServerAction } from "@/hooks/use-server-action"
import { createCourseGroup } from "@/lib/actions/groups"

export function CreateGroup({
  teacherProfileId,
  options,
}: {
  teacherProfileId: string
  options: GroupFormOptions
}) {
  const { pending, error, run } = useServerAction()
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <ActionButton
        icon={<Plus className="size-3.5" />}
        onClick={() => setOpen(true)}
      >
        Nowa grupa
      </ActionButton>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <GroupForm
        initial={EMPTY_GROUP}
        options={options}
        pending={pending}
        error={error}
        onCancel={() => setOpen(false)}
        onSubmit={(values) =>
          run(
            () => createCourseGroup(teacherProfileId, values),
            () => setOpen(false)
          )
        }
      />
    </div>
  )
}
