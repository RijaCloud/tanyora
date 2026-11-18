export function ProfilePageSkeleton() {
  return (
    <main className="ui-page px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1320px] space-y-8 animate-pulse">
        <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[32px] bg-[linear-gradient(135deg,_#111111,_#2b2b2b)] p-8 md:p-10">
            <div className="h-4 w-32 rounded-full bg-white/10" />
            <div className="mt-5 h-12 w-72 rounded-[20px] bg-white/10" />
            <div className="mt-5 h-4 w-11/12 rounded-full bg-white/10" />
            <div className="mt-3 h-4 w-9/12 rounded-full bg-white/10" />
            <div className="mt-8 flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="h-20 w-20 rounded-full bg-white/10" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-40 rounded bg-white/10" />
                <div className="h-4 w-44 rounded bg-white/10" />
                <div className="h-7 w-28 rounded-full bg-white/10" />
              </div>
            </div>
          </div>

          <div className="ui-card-flat rounded-[32px] p-8 md:p-10">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div className="ui-surface-soft h-4 w-20 rounded" />
                <div className="ui-surface-soft h-10 w-64 rounded" />
              </div>
              <div className="h-11 w-40 rounded-2xl bg-[#f5d7d8]" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="ui-surface-soft rounded-[22px] px-5 py-5 space-y-3">
                  <div className="ui-surface-muted h-3 w-20 rounded" />
                  <div className="h-8 w-24 rounded bg-[#ededed]" />
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="ui-surface-soft rounded-[24px] border ui-border p-5 space-y-3">
                  <div className="h-3 w-24 rounded bg-[#ededed]" />
                  <div className="h-5 w-32 rounded bg-[#ededed]" />
                  <div className="h-4 w-full rounded bg-[#ededed]" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <div className="h-11 w-36 rounded-2xl bg-[#f7f7f7]" />
              <div className="ui-surface-soft h-11 w-28 rounded-2xl" />
            </div>
          </div>
        </section>

        <section className="ui-card-flat rounded-[32px] p-8 md:p-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="h-4 w-32 rounded bg-[#f1f1f1]" />
              <div className="h-10 w-80 rounded bg-[#f1f1f1]" />
            </div>
            <div className="h-4 w-80 rounded bg-[#f1f1f1]" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="ui-card-flat rounded-[24px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="h-6 w-20 rounded-full bg-[#f5d7d8]" />
                    <div className="h-7 w-32 rounded bg-[#f1f1f1]" />
                    <div className="h-4 w-full rounded bg-[#f1f1f1]" />
                    <div className="h-4 w-3/4 rounded bg-[#f1f1f1]" />
                  </div>
                  <div className="ui-surface-soft h-11 w-11 rounded-full border ui-border" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="ui-card-flat rounded-[32px] p-8 md:p-10">
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-[#f1f1f1]" />
              <div className="h-10 w-72 rounded bg-[#f1f1f1]" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="ui-surface-soft rounded-[24px] p-6 space-y-4">
                  <div className="h-4 w-24 rounded bg-[#ededed]" />
                  <div className="h-6 w-40 rounded bg-[#ededed]" />
                  <div className="h-4 w-32 rounded bg-[#ededed]" />
                </div>
              ))}
            </div>
          </section>

          <section className="ui-card-flat rounded-[32px] p-8 md:p-10">
            <div className="space-y-3">
              <div className="h-4 w-28 rounded bg-[#f1f1f1]" />
              <div className="ui-surface-soft h-10 w-64 rounded" />
            </div>
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="ui-surface-soft rounded-[24px] border ui-border p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-28 rounded bg-[#ededed]" />
                      <div className="h-7 w-32 rounded bg-[#ededed]" />
                      <div className="h-4 w-24 rounded bg-[#ededed]" />
                    </div>
                    <div className="space-y-3 text-right">
                      <div className="h-7 w-24 rounded bg-[#ededed]" />
                      <div className="flex justify-end gap-2">
                        <div className="h-7 w-20 rounded-full bg-[#f7dfe0]" />
                        <div className="h-7 w-16 rounded-full border border-[#EAEAEA] bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
