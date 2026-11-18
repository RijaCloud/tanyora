export function ProfileSettingsPageSkeleton() {
  return (
    <main className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1320px] animate-pulse">
        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[32px] bg-[linear-gradient(135deg,#111111,#222222)] p-8 md:p-10">
            <div className="h-4 w-28 rounded-full bg-white/10" />
            <div className="mt-5 h-12 w-72 rounded-[20px] bg-white/10" />
            <div className="mt-5 h-4 w-11/12 rounded-full bg-white/10" />
            <div className="mt-3 h-4 w-9/12 rounded-full bg-white/10" />
            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="mt-4 h-10 w-40 rounded bg-white/10" />
              <div className="mt-4 h-4 w-full rounded bg-white/10" />
            </div>
            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="h-3 w-20 rounded bg-white/10" />
              <div className="mt-4 h-5 w-32 rounded bg-white/10" />
              <div className="mt-3 h-4 w-48 rounded bg-white/10" />
              <div className="mt-4 h-3 w-24 rounded bg-white/10" />
              <div className="mt-3 h-4 w-24 rounded bg-white/10" />
            </div>
          </div>

          <section className="rounded-[32px] border border-[#EAEAEA] bg-white p-8 shadow-[0_18px_45px_rgba(17,17,17,0.05)] md:p-10">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div className="h-4 w-36 rounded bg-[#f1f1f1]" />
                <div className="h-10 w-80 rounded bg-[#f1f1f1]" />
              </div>
              <div className="h-11 w-44 rounded-2xl bg-[#f7f7f7]" />
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[170px_minmax(0,1fr)]">
              <div className="space-y-5">
                <div className="flex items-center gap-4 xl:block">
                  <div className="h-28 w-28 rounded-full bg-[#f1f1f1]" />
                  <div className="flex-1 space-y-3 xl:mt-4">
                    <div className="h-4 w-28 rounded bg-[#f1f1f1]" />
                    <div className="h-4 w-full rounded bg-[#f1f1f1]" />
                  </div>
                </div>
                <div className="h-14 rounded-2xl bg-[#f3f3f3]" />
              </div>

              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <div className="h-4 w-28 rounded bg-[#f1f1f1]" />
                      <div className="h-14 rounded-2xl bg-[#f3f3f3]" />
                    </div>
                  ))}
                  <div className="space-y-2 md:col-span-2">
                    <div className="h-4 w-20 rounded bg-[#f1f1f1]" />
                    <div className="h-14 rounded-2xl bg-[#f3f3f3]" />
                  </div>
                </div>

                <div>
                  <div className="h-4 w-40 rounded bg-[#f1f1f1]" />
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <div className="h-4 w-24 rounded bg-[#f1f1f1]" />
                        <div className="h-14 rounded-2xl bg-[#f3f3f3]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <div className="h-12 w-60 rounded-2xl bg-[#f1c2c4]" />
              <div className="h-12 w-28 rounded-2xl bg-[#f3f3f3]" />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
