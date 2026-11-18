const shimmer = "animate-pulse rounded-[12px] bg-[var(--surface-2)]";

/** Matches the category editorial grid while the route and its feed resolve. */
export default function CategoryLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement de la catégorie"
      className="news-public-page mx-auto max-w-[1141px] space-y-8 px-4 pb-16 pt-6 lg:px-0"
    >
      <section className="flex gap-2 overflow-hidden border-b border-[var(--border-soft)] pb-4" aria-hidden="true">
        <div className={`${shimmer} h-8 w-20 shrink-0`} />
        <div className={`${shimmer} h-8 w-24 shrink-0`} />
        <div className={`${shimmer} h-8 w-28 shrink-0`} />
        <div className={`${shimmer} h-8 w-20 shrink-0`} />
        <div className={`${shimmer} h-8 w-24 shrink-0`} />
      </section>

      <section className="grid gap-[19px] xl:grid-cols-[793px_329px]" aria-hidden="true">
        <div className="space-y-5">
          <div className={`${shimmer} h-4 w-24`} />
          <div className={`${shimmer} h-9 w-[min(28rem,80%)]`} />
          <div className="h-px bg-[var(--border-strong)]" />
          <div className="grid gap-5 xl:grid-cols-[280px_1px_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className={`${shimmer} h-3 w-36`} />
                <div className={`${shimmer} h-5 w-full`} />
                <div className={`${shimmer} h-3 w-4/5`} />
              </div>
              <div className="h-px bg-[var(--border-soft)]" />
              <div className="space-y-3">
                <div className={`${shimmer} h-3 w-32`} />
                <div className={`${shimmer} h-5 w-11/12`} />
                <div className={`${shimmer} h-3 w-3/4`} />
              </div>
            </div>
            <div className="hidden w-px bg-[var(--border-soft)] xl:block" />
            <div className={`${shimmer} min-h-[420px] w-full`} />
          </div>
        </div>

        <aside className="space-y-5">
          <div className={`${shimmer} h-4 w-20`} />
          <div className={`${shimmer} h-[198px] w-full`} />
          <div className={`${shimmer} h-4 w-11/12`} />
          <div className={`${shimmer} h-3 w-full`} />
          <div className={`${shimmer} h-3 w-4/5`} />
        </aside>
      </section>
    </main>
  );
}
