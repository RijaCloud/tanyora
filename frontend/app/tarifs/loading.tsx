function SkeletonLine({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-full bg-[var(--surface-3)] ${className}`} />;
}

export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Chargement des abonnements" className="ui-page min-h-[760px]">
      <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto mb-10 flex max-w-3xl flex-col items-center gap-4 text-center">
          <SkeletonLine className="h-12 w-[min(28rem,82vw)]" />
          <SkeletonLine className="h-5 w-[min(42rem,88vw)]" />
          <SkeletonLine className="h-5 w-[min(32rem,74vw)]" />
        </div>

        <div className="mx-auto mb-10 flex h-11 w-48 animate-pulse rounded-full bg-[var(--surface-3)] p-1">
          <div className="h-full w-1/2 rounded-full bg-[var(--surface-4)]" />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {["free", "essentiel", "business"].map((plan) => (
            <section key={plan} className="ui-card min-h-[510px] rounded-[24px] p-6 sm:p-7">
              <SkeletonLine className="h-4 w-24" />
              <SkeletonLine className="mt-6 h-9 w-32" />
              <SkeletonLine className="mt-4 h-5 w-40" />
              <div className="mt-8 space-y-4 border-t border-[var(--border-soft)] pt-6">
                {[1, 2, 3, 4, 5].map((line) => (
                  <SkeletonLine key={line} className="h-4 w-full" />
                ))}
              </div>
              <SkeletonLine className="mt-10 h-11 w-full" />
            </section>
          ))}
        </div>

        <section className="ui-card mt-10 grid gap-5 rounded-[24px] p-6 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="space-y-3">
              <SkeletonLine className="h-5 w-40" />
              <SkeletonLine className="h-4 w-full" />
              <SkeletonLine className="h-4 w-4/5" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
