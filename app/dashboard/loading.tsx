export default function DashboardLoading() {
  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="mt-14 flex h-16 items-center border-b border-border bg-card/80 px-4 sm:px-6 md:mt-0">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  )
}
