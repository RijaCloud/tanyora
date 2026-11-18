export function InvoicesPageSkeleton() {
  return (
    <main className="ui-page px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1180px] space-y-8 animate-pulse">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,_#111111,_#2b2b2b)] p-8 text-white md:p-10">
          <div className="h-7 w-28 rounded-full bg-white/10" />
          <div className="mt-5 h-12 w-72 rounded-2xl bg-white/10" />
          <div className="mt-4 h-4 w-11/12 rounded bg-white/10" />
          <div className="mt-3 h-4 w-8/12 rounded bg-white/10" />
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="h-8 w-28 rounded-full bg-white/10" />
            <div className="h-8 w-24 rounded-full bg-white/10" />
          </div>
        </section>

        <section className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <article key={index} className="ui-card rounded-[24px] p-6 shadow-[0_14px_34px_rgba(17,17,17,0.04)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-32 rounded bg-[#ededed]" />
                  <div className="h-8 w-36 rounded bg-[#ededed]" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-7 w-24 rounded-full bg-[#f7dfe0]" />
                    <div className="h-7 w-24 rounded-full bg-[#f1f1f1]" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:min-w-[520px]">
                  {Array.from({ length: 3 }).map((__, statIndex) => (
                  <div key={statIndex} className="ui-surface-soft rounded-[18px] px-4 py-4 space-y-3">
                      <div className="h-3 w-20 rounded bg-[#ededed]" />
                      <div className="h-6 w-24 rounded bg-[#ededed]" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="h-12 w-40 rounded-2xl bg-[#f1f1f1]" />
                <div className="h-12 w-56 rounded-2xl bg-[#f5d7d8]" />
              </div>
            </article>
          ))}
        </section>

        <nav className="ui-card flex flex-col gap-3 rounded-[28px] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-4 w-72 rounded bg-[#f1f1f1]" />
          <div className="flex gap-3">
            <div className="h-12 w-40 rounded-2xl bg-[#f1f1f1]" />
            <div className="h-12 w-36 rounded-2xl bg-[#f5d7d8]" />
          </div>
        </nav>
      </div>
    </main>
  );
}
