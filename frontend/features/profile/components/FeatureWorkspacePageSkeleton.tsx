type FeatureWorkspacePageSkeletonProps = {
  eyebrow?: string;
  titleWidthClassName?: string;
  descriptionLines?: number;
  tabCount?: number;
  fieldCount?: number;
  cardCount?: number;
};

export function FeatureWorkspacePageSkeleton({
  eyebrow = "Gestion",
  titleWidthClassName = "w-80",
  descriptionLines = 2,
  tabCount = 2,
  fieldCount = 5,
  cardCount = 3,
}: FeatureWorkspacePageSkeletonProps = {}) {
  return (
    <main className="ui-page px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1320px] space-y-8 animate-pulse">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,_#111111,_#2b2b2b)] p-8 text-white md:p-10">
          <div className="h-6 w-28 rounded-full bg-white/10" />
          <div className={`mt-5 h-12 rounded-[20px] bg-white/10 ${titleWidthClassName}`} />
          {Array.from({ length: descriptionLines }).map((_, index) => (
            <div
              key={index}
              className={`h-4 rounded-full bg-white/10 ${
                index === 0 ? "mt-4 w-10/12" : index === descriptionLines - 1 ? "mt-3 w-7/12" : "mt-3 w-9/12"
              }`}
            />
          ))}
          <div className="mt-6 h-11 w-36 rounded-2xl bg-white/10" />
        </section>

        <section className="ui-surface rounded-[32px] border ui-border p-6 md:p-8">
          <div className="flex flex-wrap gap-2 border-b ui-border pb-4">
            {Array.from({ length: tabCount }).map((_, index) => (
              <div key={index} className="ui-surface-soft h-10 w-36 rounded-2xl" />
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="ui-surface-soft rounded-[28px] border ui-border p-6">
              <div className="mb-5 space-y-3">
                <div className="ui-surface-muted h-4 w-20 rounded" />
                <div className="ui-surface-muted h-8 w-52 rounded" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: fieldCount }).map((_, index) => (
                  <div key={index} className={`space-y-2 ${index === fieldCount - 1 ? "md:col-span-2" : ""}`}>
                    <div className="ui-surface-muted h-4 w-24 rounded" />
                    <div className={`ui-surface rounded-2xl ${index === fieldCount - 1 ? "h-40" : "h-14"} border ui-border`} />
                  </div>
                ))}
              </div>

              <div className="mt-5 h-12 w-full rounded-2xl bg-[color:color-mix(in_srgb,var(--m3-secondary)_18%,var(--surface-3))]" />
            </section>

            <section className="ui-surface rounded-[28px] border ui-border p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="space-y-3">
                  <div className="ui-surface-muted h-4 w-20 rounded" />
                  <div className="ui-surface-muted h-8 w-44 rounded" />
                </div>
                <div className="ui-surface-soft h-7 w-24 rounded-full" />
              </div>

              <div className="space-y-4">
                {Array.from({ length: cardCount }).map((_, index) => (
                  <div key={index} className="ui-surface-soft rounded-[22px] border ui-border p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="ui-surface-muted h-5 w-40 rounded" />
                        <div className="ui-surface-muted h-4 w-full rounded" />
                        <div className="ui-surface-muted h-4 w-3/4 rounded" />
                        <div className="ui-surface-muted h-3 w-28 rounded" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="ui-surface h-9 w-9 rounded-xl border ui-border" />
                        <div className="ui-surface h-9 w-9 rounded-xl border ui-border" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
