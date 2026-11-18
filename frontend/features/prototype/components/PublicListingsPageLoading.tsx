"use client";

type PublicListingsPageLoadingProps = {
  showBoosted?: boolean;
};

export default function PublicListingsPageLoading({ showBoosted = false }: PublicListingsPageLoadingProps) {
  return (
    <div className="ui-page">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-4 pb-[50px] pt-[20px] sm:px-6 lg:px-8">
        {showBoosted ? (
          <>
            <div className="w-full">
              <div className="mb-4 h-4 w-28 animate-pulse rounded-full bg-[var(--surface-4)]" />
              <div className="flex w-full items-start gap-[14px] overflow-x-hidden py-2">
                <div className="h-[240px] w-[180px] shrink-0 animate-pulse rounded-[12px] bg-[var(--surface-3)]" />
                <div className="h-[240px] w-[180px] shrink-0 animate-pulse rounded-[12px] bg-[var(--surface-2)]" />
                <div className="h-[240px] w-[180px] shrink-0 animate-pulse rounded-[12px] bg-[var(--surface-2)]" />
                <div className="h-[240px] w-[180px] shrink-0 animate-pulse rounded-[12px] bg-[var(--surface-2)]" />
                <div className="hidden h-[240px] w-[180px] shrink-0 animate-pulse rounded-[12px] bg-[var(--surface-2)] lg:block" />
              </div>
            </div>

            <div className="w-full pt-[32px]">
              <div className="mb-4 h-4 w-24 animate-pulse rounded-full bg-[var(--surface-4)]" />
              <div className="flex w-full flex-col gap-[14px] md:flex-row">
                <div className="h-[116px] w-full animate-pulse rounded-[12px] bg-[var(--surface-3)] md:flex-1" />
                <div className="h-[116px] w-full animate-pulse rounded-[12px] bg-[var(--surface-3)] md:flex-1" />
                <div className="h-[116px] w-full animate-pulse rounded-[12px] bg-[var(--surface-3)] md:flex-1" />
              </div>
            </div>
          </>
        ) : null}

        <div className={`flex w-full flex-col items-start gap-[14px] ${showBoosted ? "pt-[32px]" : "pt-[8px]"} lg:flex-row`}>
          <aside className="w-full shrink-0 rounded-[12px] bg-[var(--surface-2)] p-3 lg:w-[202px]">
            <div className="mb-3 h-8 animate-pulse rounded-[10px] bg-[var(--surface-4)]" />
            <div className="mb-2 h-7 animate-pulse rounded-[10px] bg-[var(--surface-3)]" />
            <div className="mb-2 h-7 animate-pulse rounded-[10px] bg-[var(--surface-3)]" />
            <div className="h-7 animate-pulse rounded-[10px] bg-[var(--surface-3)]" />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--surface-4)]" />
              <div className="h-[38px] w-full animate-pulse rounded-[50px] bg-[var(--surface-3)] sm:max-w-[350px]" />
            </div>

            <div className="flex w-full flex-wrap items-start gap-[14px]">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[240px] w-full animate-pulse rounded-[12px] bg-[var(--surface-2)] md:basis-[calc(50%-7px)] md:max-w-[calc(50%-7px)] lg:basis-[180px] lg:max-w-[180px]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
