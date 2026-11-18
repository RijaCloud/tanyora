"use client";

import Link from "next/link";

import { AppImage } from "@/components/ui/AppImage";
import { ArticleCardActions } from "@/features/news/components/ArticleCardActions";
import { NEWS_IMAGE_PLACEHOLDER } from "@/features/news/lib/image-placeholder";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";
import type { NewsArticle } from "@/features/news/types";

/**
 * Carte d'article de la page d'accueil.
 *
 * Reprend volontairement la presentation de `SideFeature` dans
 * `features/news/components/NewsLandingPage.tsx` pour que l'accueil et
 * /actualites se ressemblent. La duplication est assumee tant que les
 * dependances de `SideFeature` restent internes a ce fichier : les extraire
 * reviendrait a modifier /actualites sans pouvoir en verifier le rendu.
 * A mutualiser des qu'un environnement de preproduction existe.
 */

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
  "&rsquo;": "'",
  "&lsquo;": "'",
  "&rdquo;": '"',
  "&ldquo;": '"',
  "&hellip;": "...",
  "&ndash;": "-",
  "&mdash;": "-",
};

function toPlainText(value: string, maxLength: number) {
  let output = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  for (const [entity, decoded] of Object.entries(HTML_ENTITIES)) {
    output = output.split(entity).join(decoded);
  }

  output = output
    .replace(/&#(\d+);/g, (_, code) => {
      const parsed = Number.parseInt(code, 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      const parsed = Number.parseInt(code, 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    });

  return output.length <= maxLength ? output : `${output.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function formatArticleDate(input: string) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function resolveLabel(article: NewsArticle) {
  return article.categoryLabel || article.category || "Actualité";
}

type HomeNewsCardProps = {
  article: NewsArticle;
  /** `compact` : image plus basse et titre plus petit, pour les grilles. */
  size?: "default" | "compact";
  /** Masque le libellé de rubrique au-dessus de la carte. */
  hideLabel?: boolean;
};

export function HomeNewsCard({ article, size = "default", hideLabel = false }: HomeNewsCardProps) {
  const isCompact = size === "compact";

  return (
    <section className="space-y-3">
      {hideLabel ? null : (
        <p className="text-[12px] font-semibold text-[var(--text-main)]">{resolveLabel(article)}</p>
      )}
      <div className="space-y-3">
        <Link href={getEditorialArticlePath(article)} className="block space-y-3">
          <div className="overflow-hidden rounded-[12px] bg-[#27624f]">
            <AppImage
              alt={article.title}
              src={article.imageUrl || NEWS_IMAGE_PLACEHOLDER}
              className={`w-full object-cover transition-transform duration-700 ease-[var(--motion-ease-standard)] hover:scale-[1.02] ${isCompact ? "h-[151px]" : "h-[198px]"}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
            <span>{article.authorName || "Tanyora Actualité & Reportages"}</span>
            <span>{formatArticleDate(article.publishedAt)}</span>
          </div>

          <h3
            className={`font-[Georgia] font-bold leading-[1.12] text-[var(--text-main)] hover:text-[#27624f] ${isCompact ? "text-[15px]" : "text-[18px]"}`}
          >
            {article.title}
          </h3>

          {isCompact ? null : (
            <p className="text-[12px] leading-[1.45] text-[var(--text-muted)]">
              {toPlainText(article.excerpt || article.content, 110)}
            </p>
          )}
        </Link>

        <ArticleCardActions article={article} />
      </div>
    </section>
  );
}
