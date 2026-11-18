import Link from "next/link";

import { PublicUnavailableState } from "@/components/errors/PublicUnavailableState";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";
import type { NewsArticle } from "@/features/news/types";

function formatUpdateDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "A l'instant";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function EmptyNewsFeed() {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-1)] px-6 py-16 text-center">
      <p className="text-sm font-semibold text-[var(--text-main)]">Le fil d&apos;info est en cours de mise a jour.</p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Revenez dans quelques instants pour consulter les dernieres informations.</p>
    </div>
  );
}

function StreamItem({ article, index }: { article: NewsArticle; index: number }) {
  return (
    <li className="grid gap-3 border-b border-[var(--border-soft)] py-6 last:border-b-0 sm:grid-cols-[142px_minmax(0,1fr)] sm:gap-7">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] sm:items-start sm:pt-1">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#27624f]" />
        <time dateTime={article.publishedAt}>{formatUpdateDate(article.publishedAt)}</time>
      </div>
      <Link href={getEditorialArticlePath(article)} className="group block">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#27624f]">Info {String(index).padStart(2, "0")}</span>
        <h2 className="mt-1 font-[Georgia] text-[21px] font-bold leading-[1.2] text-[var(--text-main)] transition-colors group-hover:text-[#27624f] sm:text-[25px]">
          {article.title}
        </h2>
        <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#27624f] opacity-0 transition-opacity group-hover:opacity-100">
          Lire l&apos;information <span aria-hidden>→</span>
        </span>
      </Link>
    </li>
  );
}

export function NewsFeedPage({ articles, isUnavailable = false }: { articles: NewsArticle[]; isUnavailable?: boolean }) {
  const [lead, ...stream] = articles;

  return (
    <main className="news-public-page min-h-screen">
      <div className="mx-auto max-w-[1141px] space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-0">
        <header className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#27624f]">Fil d&apos;info</p>
          <h1 className="mt-2 font-[Georgia] text-[34px] font-bold leading-[1.04] tracking-[-0.03em] text-[var(--text-main)] sm:text-[42px]">
            Les dernieres informations
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Suivez les informations publiees au fil de la journee.</p>
        </header>

        {isUnavailable ? (
          <PublicUnavailableState
            compact
            title="Le fil d'information est temporairement indisponible"
            description="Réessayez dans quelques instants pour retrouver les dernières informations."
          />
        ) : null}

        {lead ? (
          <section>
            <Link href={getEditorialArticlePath(lead)} className="group block rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-[#27624f]/45 sm:p-8 lg:p-10">
              <div className="flex min-h-[220px] max-w-3xl flex-col justify-center">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  <span className="rounded-full bg-[#27624f] px-2.5 py-1 text-[10px] tracking-[0.16em] text-white">Derniere information</span>
                  <time dateTime={lead.publishedAt}>{formatUpdateDate(lead.publishedAt)}</time>
                </div>
                <h2 className="mt-5 font-[Georgia] text-[30px] font-bold leading-[1.08] tracking-[-0.025em] text-[var(--text-main)] transition-colors group-hover:text-[#27624f] sm:text-[38px]">
                  {lead.title}
                </h2>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#27624f]">Lire l&apos;information <span aria-hidden>→</span></span>
              </div>
            </Link>
          </section>
        ) : <section><EmptyNewsFeed /></section>}

        {stream.length > 0 ? (
          <section className="border-t border-[var(--border-soft)] pt-7 sm:pt-9">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#27624f]">En continu</p>
                <h2 className="mt-2 font-[Georgia] text-[28px] font-bold leading-none tracking-[-0.025em] text-[var(--text-main)] sm:text-[32px]">Toutes les mises a jour</h2>
              </div>
              <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">{articles.length} infos</span>
            </div>
            <ol className="mt-5">
              {stream.map((article, index) => <StreamItem key={article.id} article={article} index={index + 2} />)}
            </ol>
          </section>
        ) : null}
      </div>
    </main>
  );
}
