export function ArticlesPageSkeleton() {
  return (
    <main className="mx-auto max-w-[1120px] px-4 py-10 md:px-6 md:py-14">
      <div className="space-y-8 animate-pulse">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,_#111111,_#2b2b2b)] p-8 text-white md:p-10">
          <div className="h-4 w-28 rounded-full bg-white/10" />
          <div className="mt-5 h-12 w-72 rounded-[20px] bg-white/10" />
          <div className="mt-4 h-4 w-11/12 rounded-full bg-white/10" />
          <div className="mt-3 h-4 w-9/12 rounded-full bg-white/10" />
          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-white/10" />
                <div className="h-14 rounded-2xl bg-white/10" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-white/10" />
                <div className="h-14 rounded-2xl bg-white/10" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="h-4 w-36 rounded bg-white/10" />
                <div className="h-56 rounded-[24px] bg-white/10" />
              </div>
            </div>
            <div className="mt-5 h-12 w-full rounded-2xl bg-white/10" />
          </div>
        </section>

        <section className="rounded-[28px] border border-[#EAEAEA] bg-white p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="h-4 w-20 rounded bg-[#f1f1f1]" />
              <div className="h-10 w-56 rounded bg-[#f1f1f1]" />
              <div className="h-4 w-96 rounded bg-[#f1f1f1]" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <article key={index} className="rounded-[22px] border border-[#EAEAEA] bg-[#fcfcfc] p-5">
                <div className="h-3 w-28 rounded bg-[#ededed]" />
                <div className="mt-3 h-7 w-44 rounded bg-[#ededed]" />
                <div className="mt-3 h-4 w-full rounded bg-[#ededed]" />
                <div className="mt-2 h-4 w-10/12 rounded bg-[#ededed]" />
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="h-10 w-36 rounded-2xl bg-[#f5d7d8]" />
                  <div className="h-10 w-36 rounded-2xl bg-[#f1f1f1]" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
