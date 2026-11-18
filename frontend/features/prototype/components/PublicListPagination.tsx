"use client";

type PublicListPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function buildPageWindow(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

export default function PublicListPagination({
  currentPage,
  totalPages,
  onPageChange,
}: PublicListPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPageWindow(currentPage, totalPages);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="ui-surface ui-border ui-text-main rounded-full border px-4 py-2 text-[12px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-45"
      >
        Précédent
      </button>
      {pages.map((page, index) => {
        const previousPage = pages[index - 1];
        const shouldShowGap = typeof previousPage === "number" && page - previousPage > 1;

        return (
          <div key={page} className="flex items-center gap-2">
            {shouldShowGap ? <span className="ui-text-soft px-1 text-[12px]">…</span> : null}
            <button
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
                page === currentPage
                  ? "bg-[#27624f] text-white shadow-[0_10px_24px_rgba(204,32,42,0.22)]"
                  : "ui-surface ui-border ui-text-main border hover:border-[#27624f] hover:text-[#27624f]"
              }`}
            >
              {page}
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="ui-surface ui-border ui-text-main rounded-full border px-4 py-2 text-[12px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-45"
      >
        Suivant
      </button>
    </div>
  );
}
