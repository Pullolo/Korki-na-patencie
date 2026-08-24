import Link from "next/link"

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-3xl font-bold text-foreground">404</p>
        <h1 className="mt-2 text-base font-semibold text-foreground">
          Nie ma takiej sekcji
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ta część panelu jeszcze nie istnieje albo adres jest nieaktualny.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Wróć na pulpit
        </Link>
      </div>
    </div>
  )
}
