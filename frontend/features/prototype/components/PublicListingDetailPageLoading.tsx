"use client";

export default function PublicListingDetailPageLoading() {
  return (
    <div className="ui-page min-h-screen pb-16 pt-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] bg-[#151515] px-6 py-7">
          <div className="h-3 w-20 animate-pulse rounded-full bg-white/20" />
          <div className="mt-4 h-10 w-[60%] animate-pulse rounded-[10px] bg-white/15" />
          <div className="mt-4 h-4 w-[72%] animate-pulse rounded-full bg-white/15" />
          <div className="mt-8 h-11 w-[220px] animate-pulse rounded-full bg-white/15" />
        </div>

        <div className="ui-card rounded-[28px] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] sm:p-7">
          <div className="ui-border rounded-[22px] border p-5 sm:p-6">
            <div className="h-[72px] animate-pulse rounded-[16px] bg-[#f4f5f8]" />

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="ui-border rounded-[22px] border p-5">
                <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
                  <div className="h-[300px] animate-pulse rounded-[20px] bg-[#eff1f5] sm:h-[420px]" />
                  <div className="space-y-3">
                    <div className="h-[96px] animate-pulse rounded-[18px] bg-[#f4f5f8]" />
                    <div className="h-[82px] animate-pulse rounded-[18px] bg-[#f7f8fa]" />
                    <div className="h-[82px] animate-pulse rounded-[18px] bg-[#f7f8fa]" />
                    <div className="h-[82px] animate-pulse rounded-[18px] bg-[#f7f8fa]" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-3 w-28 animate-pulse rounded-full bg-[#eceef2]" />
                  <div className="h-8 w-[54%] animate-pulse rounded-[10px] bg-[#f1f3f6]" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-[#f1f3f6]" />
                  <div className="h-4 w-[92%] animate-pulse rounded-full bg-[#f1f3f6]" />
                  <div className="h-4 w-[88%] animate-pulse rounded-full bg-[#f1f3f6]" />
                </div>
              </div>

              <div className="ui-border rounded-[22px] border p-5">
                <div className="space-y-5">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-[#eceef2]" />
                      <div className="h-4 w-[90%] animate-pulse rounded-full bg-[#f1f3f6]" />
                    </div>
                  ))}
                  <div className="h-11 animate-pulse rounded-[12px] bg-[#f2d7d9]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ui-card rounded-[28px] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] sm:p-7">
          <div className="h-3 w-24 animate-pulse rounded-full bg-[#eceef2]" />
          <div className="mt-3 h-9 w-[260px] animate-pulse rounded-[10px] bg-[#f1f3f6]" />
          <div className="mt-6 flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[250px] w-[260px] shrink-0 animate-pulse rounded-[20px] bg-[#f5f6f8]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
