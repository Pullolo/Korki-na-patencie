"use client"

import { ExternalLink, Eye, EyeOff, FileText, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ActionButton, IconAction } from "@/components/dashboard/action-button"
import { FormError } from "@/components/dashboard/form-controls"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { useServerAction } from "@/hooks/use-server-action"
import { createPage, deletePage, setPageStatus } from "@/lib/actions/content"
import { formatRelativeTime } from "@/lib/format"
import type { PageStatus } from "@/lib/generated/prisma/enums"
import { PAGE_STATUS_LABELS } from "@/lib/labels"

export type PageRow = {
  id: string
  title: string
  slug: string
  status: PageStatus
  noIndex: boolean
  updatedAt: Date
}

export function PagesTable({ pages }: { pages: PageRow[] }) {
  const router = useRouter()
  const { pending, error, run } = useServerAction()

  function addPage() {
    run(async () => {
      const page = await createPage({
        title: "Nowa strona",
        slug: "",
        content: "## Nagłówek\n\nTreść strony.",
        status: "DRAFT",
        seoTitle: null,
        seoDescription: null,
        seoOgImage: null,
        noIndex: false,
      })
      router.push(`/dashboard/strony/${page.id}`)
    })
  }

  return (
    <div>
      <ul className="divide-y divide-border">
        {pages.map((page) => (
          <li
            key={page.id}
            className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/strony/${page.id}`}
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {page.title}
                </Link>
                <StatusBadge
                  label={PAGE_STATUS_LABELS[page.status]}
                  tone={page.status === "PUBLISHED" ? "green" : "neutral"}
                />
                {page.noIndex && (
                  <StatusBadge label="noindex" tone="amber" />
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                /{page.slug} · zmieniona {formatRelativeTime(page.updatedAt)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {page.status === "PUBLISHED" && (
                <a
                  href={`/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Zobacz na stronie"
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
              <IconAction
                title={
                  page.status === "PUBLISHED"
                    ? "Cofnij do szkicu"
                    : "Opublikuj"
                }
                pending={pending}
                icon={
                  page.status === "PUBLISHED" ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )
                }
                onClick={() =>
                  run(() =>
                    setPageStatus(
                      page.id,
                      page.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
                    )
                  )
                }
              />
              <IconAction
                title="Usuń"
                danger
                pending={pending}
                icon={<Trash2 className="size-3.5" />}
                onClick={() => run(() => deletePage(page.id))}
              />
            </div>
          </li>
        ))}
      </ul>

      {pages.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <FileText className="size-6 text-muted-foreground/60" />
          <p className="text-sm font-medium text-foreground">
            Nie ma jeszcze żadnej strony
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Regulamin i polityka prywatności powstają tutaj, a nie w kodzie.
            Formularze na stronie linkują do polityki, więc warto zacząć od niej.
          </p>
        </div>
      )}

      {error && (
        <div className="px-4 pb-3 sm:px-5">
          <FormError message={error} />
        </div>
      )}

      <div className="border-t border-border p-3 sm:px-5">
        <ActionButton
          variant="ghost"
          pending={pending}
          icon={<Plus className="size-3.5" />}
          onClick={addPage}
        >
          Nowa strona
        </ActionButton>
      </div>
    </div>
  )
}
