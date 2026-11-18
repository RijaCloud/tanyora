import Link from "next/link";

import { FeaturedNewsHero } from "@/features/news/components/FeaturedNewsHero";
import { SecondaryNewsCard } from "@/features/news/components/SecondaryNewsCard";
import { NewsCategoryRail } from "@/features/news/components/NewsCategoryRail";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";
import type { NewsArticle } from "@/features/news/types";

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatArchiveTitle(year: string, month: string) {
  const parsed = new Date(`${year}-${month}-01T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return `Archives ${month}/${year}`;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function buildPaginationWindow(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

function buildPageHref(year: string, month: string, page: number) {
  return page <= 1 ? `/${year}/${month}` : `/${year}/${month}?page=${page}`;
}

function Pagination({
  currentPage,
  totalPages,
  year,
  month,
}: {
  currentPage: number;
  totalPages: number;
  year: string;
  month: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPaginationWindow(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
      <Link
        href={currentPage > 1 ? buildPageHref(year, month, currentPage - 1) : "#"}
        aria-disabled={currentPage <= 1}
        className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-1)] px-4 py-2 text-[12px] font-semibold text-[var(--text-main)] transition hover:border-[#27624f] hover:text-[#27624f] aria-disabled:pointer-events-none aria-disabled:opacity-40"
      >
        Précédent
      </Link>
      {pages.map((page, index) => {
        const previousPage = pages[index - 1];
        const showGap = typeof previousPage === "number" && page - previousPage > 1;

        return (
          <div key={page} className="flex items-center gap-2">
            {showGap ? <span className="px-1 text-[12px] text-[var(--text-soft)]">…</span> : null}
            <Link
              href={buildPageHref(year, month, page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-[12px] font-semibold transition ${
                page === currentPage
                  ? "bg-[#27624f] text-white shadow-[0_10px_24px_rgba(204,32,42,0.22)]"
                  : "border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-main)] hover:border-[#27624f] hover:text-[#27624f]"
              }`}
            >
              {page}
            </Link>
          </div>
        );
      })}
      <Link
        href={currentPage < totalPages ? buildPageHref(year, month, currentPage + 1) : "#"}
        aria-disabled={currentPage >= totalPages}
        className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-1)] px-4 py-2 text-[12px] font-semibold text-[var(--text-main)] transition hover:border-[#27624f] hover:text-[#27624f] aria-disabled:pointer-events-none aria-disabled:opacity-40"
      >
        Suivant
      </Link>
    </div>
  );
}

export function ArchiveNewsPage({
  year,
  month,
  currentPage,
  totalPages,
  totalArticles,
  articles,
  taxonomyCategories,
}: {
  year: string;
  month: string;
  currentPage: number;
  totalPages: number;
  totalArticles: number;
  articles: NewsArticle[];
  taxonomyCategories: Array<{ slug: string; label: string; uri?: string }>;
}) {
  const featuredArticle = articles[0] ?? null;
  const secondaryArticles = articles.slice(1, 4);
  const remainingArticles = articles.slice(4);
  const archiveTitle = formatArchiveTitle(year, month);

  return (
    <div className="news-public-page mx-auto max-w-[1141px] space-y-8 px-4 pb-16 pt-6 lg:px-0">
      <NewsCategoryRail
        categories={taxonomyCategories.map((category) => ({
          slug: category.slug,
          label: category.label,
          href: category.uri || `/category/${encodeURIComponent(category.slug)}`,
        }))}
      />

      <section className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-1)] px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#27624f]">Archives</p>
            <h1 className="font-[Georgia] text-[34px] font-bold leading-[1.02] text-[var(--text-main)] sm:text-[42px]">
              {archiveTitle}
            </h1>
            <p className="max-w-[680px] text-sm leading-6 text-[var(--text-muted)]">
              Retrouvez les articles publiés sur cette période dans une présentation éditoriale plus lisible.
            </p>
          </div>
          <div className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-2 text-[12px] font-semibold text-[var(--text-main)]">
            {totalArticles} article{totalArticles > 1 ? "s" : ""}
          </div>
        </div>
      </section>

      {featuredArticle ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
          <FeaturedNewsHero article={featuredArticle} />
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {secondaryArticles.map((article) => (
              <SecondaryNewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[16px] font-bold uppercase tracking-[0.18em] text-[#27624f]">Tous les articles</h2>
          <p className="text-[12px] text-[var(--text-soft)]">
            Page {currentPage} / {totalPages}
          </p>
        </div>

        {remainingArticles.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {remainingArticles.map((article) => (
              <Link
                key={article.id}
                href={getEditorialArticlePath(article)}
                className="group rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-1)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#27624f]/30 hover:shadow-[0_20px_45px_rgba(204,32,42,0.10)]"
              >
                <div className="mb-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                  <span className="truncate">{article.categoryLabel ?? article.category}</span>
                </div>
                <h3 className="font-[Georgia] text-[24px] font-bold leading-[1.08] text-[var(--text-main)] transition-colors group-hover:text-[#27624f]">
                  {article.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                  {stripHtml(article.excerpt || article.content).slice(0, 180)}
                  {(stripHtml(article.excerpt || article.content).length || 0) > 180 ? "…" : ""}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-1)] px-6 py-10 text-center text-[var(--text-muted)]">
            Aucun autre article sur cette page.
          </div>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} year={year} month={month} />
      </section>
    </div>
  );
}
