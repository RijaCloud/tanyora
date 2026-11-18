export function ProfileSavedPageSkeleton() {
  return (
    <main className="ui-page px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1320px] animate-pulse">
        <section className="ui-card-flat rounded-[20px] p-4 md:p-6">
          <div className="ui-border mb-5 flex flex-wrap gap-3 border-b pb-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-9 w-36 rounded-full bg-[#f3f3f3]" />
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <article key={index} className="ui-surface overflow-hidden rounded-[12px] p-[5px]">
                <div className="ui-border rounded-[12px] border-[2px] p-[5px]">
                  <div className="ui-surface-soft h-[170px] rounded-[8px]" />
                  <div className="mt-3 h-4 w-20 rounded bg-[#ededed]" />
                  <div className="mt-3 h-5 w-full rounded bg-[#ededed]" />
                  <div className="mt-2 h-5 w-10/12 rounded bg-[#ededed]" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-7 w-7 rounded-md bg-[#f3d8d9]" />
                    <div className="h-7 w-7 rounded-md bg-[#f3f3f3]" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
