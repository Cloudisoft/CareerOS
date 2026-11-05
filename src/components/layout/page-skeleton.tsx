/** Shown instantly while a page's data loads, so navigation never feels stuck. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-56 rounded-md bg-surface-raised" />
      <div className="mt-2 h-4 w-80 max-w-full rounded-md bg-surface-raised" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-surface" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-border bg-surface p-5">
              <div className="h-11 w-11 shrink-0 rounded-lg bg-surface-raised" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-surface-raised" />
                <div className="h-4 w-2/3 rounded bg-surface-raised" />
                <div className="h-3 w-1/3 rounded bg-surface-raised" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden h-72 rounded-xl border border-border bg-surface lg:block" />
      </div>
    </div>
  );
}
