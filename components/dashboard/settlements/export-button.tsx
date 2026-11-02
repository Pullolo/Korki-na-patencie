"use client"

import { Download } from "lucide-react"

import { ActionButton } from "@/components/dashboard/action-button"
import { useServerAction } from "@/hooks/use-server-action"
import { exportSettlement } from "@/lib/actions/settlements"

/**
 * Plik składa akcja serwerowa (te same liczby co w tabeli), a przeglądarka
 * tylko go zapisuje. Dzięki temu eksport przechodzi tą samą bramką co strona
 * i nie trzeba wystawiać osobnego adresu z danymi o wypłatach.
 */
export function ExportButton({
  period,
  teacherProfileId,
}: {
  period: string
  teacherProfileId: string | null
}) {
  const { pending, error, run } = useServerAction()

  function download() {
    run(async () => {
      const file = await exportSettlement({ period, teacherProfileId })

      const url = URL.createObjectURL(
        new Blob([file.content], { type: "text/csv;charset=utf-8" })
      )
      const link = document.createElement("a")
      link.href = url
      link.download = file.filename
      link.click()
      // Bez zwolnienia adresu plik zostaje w pamięci karty do przeładowania.
      URL.revokeObjectURL(url)
    })
  }

  return (
    <ActionButton
      onClick={download}
      variant="ghost"
      pending={pending}
      icon={<Download className="size-3.5" />}
      title={error ?? "Pobierz zestawienie jako plik dla Excela"}
    >
      Eksport
    </ActionButton>
  )
}
