"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { PublicUnavailableState } from "@/components/errors/PublicUnavailableState";
import { AppImage } from "@/components/ui/AppImage";
import { ArticleCardActions } from "@/features/news/components/ArticleCardActions";
import { NewsCategoryRail } from "@/features/news/components/NewsCategoryRail";
import { NewsTicker } from "@/features/news/components/NewsTicker";
import { NEWS_IMAGE_PLACEHOLDER } from "@/features/news/lib/image-placeholder";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";
import type { NewsArticle, NewsEditorialSection } from "@/features/news/types";


const DEFAULT_IMAGE = NEWS_IMAGE_PLACEHOLDER;

const A_LA_UNE_LABEL = "À la une";
const DEFAULT_AUTHOR_NAME = "Tanyora Actualite & Reportages";

const HTML_ENTITY_MAP: Record<string, string> = {
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

const GENERIC_CATEGORY_SLUGS = new Set(["une", "actualite", "actualites", "general"]);
const GENERIC_CATEGORY_LABELS = new Set(["à la une", "a la une", "actualite", "actualité", "actualités", "actualites", "general"]);

function decodeHtmlEntities(value: string) {
  let output = value;
  for (const [entity, decoded] of Object.entries(HTML_ENTITY_MAP)) {
    output = output.split(entity).join(decoded);
  }

  return output
    .replace(/&#(\d+);/g, (_, codePoint) => {
      const parsed = Number.parseInt(codePoint, 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => {
      const parsed = Number.parseInt(codePoint, 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    });
}

function toPlainText(value: string, maxLength?: number) {
  const plainText = decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  if (!maxLength || plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function formatDate(input: string) {
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

function formatCategoryLabel(value: string) {
  const decoded = decodeHtmlEntities(value).trim();
  if (!decoded) {
    return value;
  }

  return decoded
    .split(/\s+/)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function normalizeCategoryLabel(value: string) {
  return decodeHtmlEntities(value).trim().toLowerCase();
}

function buildCategoryStats(articles: NewsArticle[]) {
  const stats = new Map<string, { slug: string; label: string; count: number }>();

  for (const article of articles) {
    const normalizedSlug = normalizeCategoryLabel(article.category);
    const normalizedLabel = normalizeCategoryLabel(article.categoryLabel ?? article.category);

    if (GENERIC_CATEGORY_SLUGS.has(normalizedSlug) || GENERIC_CATEGORY_LABELS.has(normalizedLabel)) {
      continue;
    }

    const current = stats.get(article.category);
    if (current) {
      current.count += 1;
      continue;
    }

    stats.set(article.category, {
      slug: article.category,
      label: formatCategoryLabel(article.categoryLabel ?? article.category),
      count: 1,
    });
  }

  return Array.from(stats.values()).sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.label.localeCompare(right.label, "fr");
  });
}

function hasAlaUne(article: NewsArticle) {
  const candidates = [article.categoryLabel, ...(article.tags ?? [])].filter(Boolean) as string[];
  return candidates.some((value) => {
    const normalized = normalizeCategoryLabel(value);
    return normalized === "à la une" || normalized === "a la une";
  });
}

function resolveEditorialSection(article: NewsArticle) {
  const candidates = [...(article.tags ?? []), article.categoryLabel, article.category].filter(Boolean) as string[];

  const match = candidates.find((value) => {
    const normalized = normalizeCategoryLabel(value);
    return !GENERIC_CATEGORY_LABELS.has(normalized) && !GENERIC_CATEGORY_SLUGS.has(normalized);
  });

  return match ?? article.categoryLabel ?? article.category;
}

function resolvePrimaryTag(article: NewsArticle) {
  return resolveEditorialSection(article);
}

function resolveAuthorSource(article: NewsArticle) {
  return decodeHtmlEntities(article.authorName ?? DEFAULT_AUTHOR_NAME);
}

function SmallMeta({ article }: { article: NewsArticle }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
      {hasAlaUne(article) ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#27624f] px-2 py-[3px] text-white">
          {A_LA_UNE_LABEL}
        </span>
      ) : null}
      <span>{resolveAuthorSource(article)}</span>
      <span>{formatDate(article.publishedAt)}</span>
    </div>
  );
}

function TextStory({ article }: { article: NewsArticle }) {
  return (
    <div className="space-y-3 text-[var(--text-main)]">
      <Link href={getEditorialArticlePath(article)} className="group block space-y-3">
        <SmallMeta article={article} />
        <h3 className="line-clamp-3 font-[Georgia] text-[18px] font-bold leading-[1.05] group-hover:text-[#27624f]">{article.title}</h3>
        <p className="text-[12px] leading-[1.45] text-[var(--text-muted)]">{toPlainText(article.excerpt || article.content, 125)}</p>
      </Link>
      <ArticleCardActions article={article} />
    </div>
  );
}

function LargeImageStory({ article }: { article: NewsArticle }) {
  const image = article.imageUrl || DEFAULT_IMAGE;

  return (
    <Link href={getEditorialArticlePath(article)} className="group block h-full">
      <div data-testid="editorial-story-image" className="h-full min-h-[420px] overflow-hidden rounded-[12px] bg-[var(--surface-3)]">
        <AppImage alt={article.title} src={image} responsiveSources={article.imageSources} sizes="(min-width: 1280px) 493px, 100vw" eager withLoader className="h-full min-h-[420px] w-full object-cover transition-transform duration-700 ease-[var(--motion-ease-standard)] group-hover:scale-[1.025] group-focus-visible:scale-[1.025]" />
      </div>
    </Link>
  );
}

function getEditorialStripHeadline(title: string) {
  const normalized = normalizeCategoryLabel(title);
  const headlines: Record<string, { lead: string; accent: string }> = {
    breaking: { lead: "L'essentiel,", accent: "maintenant." },
    politique: { lead: "Le pouvoir,", accent: "en mouvement." },
    social: { lead: "La société,", accent: "au quotidien." },
    sport: { lead: "Le jeu,", accent: "en direct." },
    partenaires: { lead: "Les initiatives,", accent: "à suivre." },
    international: { lead: "Le monde,", accent: "en perspective." },
    recommandations: { lead: "Nos choix,", accent: "à découvrir." },
  };

  return headlines[normalized] ?? { lead: "Les sujets qui comptent,", accent: "aujourd'hui." };
}

function InteractiveEditorialStories({
  articles,
  fallbackArticle,
}: {
  articles: NewsArticle[];
  fallbackArticle: NewsArticle;
}) {
  const storyPool = articles.filter(Boolean).slice(0, 2);
  const defaultArticle = storyPool[0] ?? fallbackArticle;
  const [activeArticleId, setActiveArticleId] = useState(defaultArticle.id);
  const [displayedArticle, setDisplayedArticle] = useState(defaultArticle);

  useEffect(() => {
    setActiveArticleId(defaultArticle.id);
    setDisplayedArticle(defaultArticle);
  }, [defaultArticle.id]);

  const selectStory = (article: NewsArticle) => {
    setActiveArticleId(article.id);
    setDisplayedArticle(article);
  };

  return (
    <div className="grid items-stretch gap-5 xl:grid-cols-[280px_1px_minmax(0,1fr)]">
      <div className="space-y-5">
        {storyPool.map((article, index) => (
          <div
            key={article.id}
            data-testid="editorial-story-trigger"
            data-active={article.id === activeArticleId ? "true" : "false"}
            className="space-y-5"
            onMouseEnter={() => selectStory(article)}
            onFocusCapture={() => selectStory(article)}
          >
            <TextStory article={article} />
            {index === 0 && storyPool.length > 1 ? <div className="h-px bg-[var(--border-soft)]" /> : null}
          </div>
        ))}
      </div>
      <div className="hidden w-px bg-[var(--border-soft)] xl:block" />
      <LargeImageStory article={displayedArticle} />
    </div>
  );
}

export function EditorialStrip({
  title,
  articles,
  fallbackArticle,
}: {
  title: string;
  articles: NewsArticle[];
  fallbackArticle: NewsArticle;
}) {
  const headline = getEditorialStripHeadline(title);

  return (
    <section>
      <h2 className="ui-section-kicker mb-2 text-[16px]">{title}</h2>
      <div className="space-y-4">
        <div className="flex min-h-[46px] items-center">
          <p className="text-[clamp(1.5rem,2.35vw,2.1rem)] font-bold leading-[1.03] tracking-[-0.04em] text-[var(--text-main)]">
            {headline.lead} <em className="ui-editorial-accent whitespace-nowrap">{headline.accent}</em>
          </p>
        </div>
        <div className="h-px bg-[var(--border-strong)]" />
        <InteractiveEditorialStories articles={articles} fallbackArticle={fallbackArticle} />
      </div>
    </section>
  );
}

export function SideFeature({ title, article }: { title: string; article: NewsArticle }) {
  return (
    <section className="space-y-3">
      <p className="text-[12px] font-semibold text-[var(--text-main)]">{title}</p>
      <div className="space-y-3">
        <Link href={getEditorialArticlePath(article)} className="block space-y-3">
          <div className="overflow-hidden rounded-[12px] bg-[#27624f]">
            <AppImage alt={article.title} src={article.imageUrl || DEFAULT_IMAGE} responsiveSources={article.imageSources} sizes="(min-width: 1280px) 329px, (min-width: 640px) 50vw, 100vw" withLoader className="h-[198px] w-full object-cover transition-transform duration-700 ease-[var(--motion-ease-standard)] hover:scale-[1.02]" />
          </div>
          <SmallMeta article={article} />
          <h3 className="font-[Georgia] text-[18px] font-bold leading-[1.12] text-[var(--text-main)] hover:text-[#27624f]">{article.title}</h3>
          <p className="text-[12px] leading-[1.45] text-[var(--text-muted)]">{toPlainText(article.excerpt || article.content, 110)}</p>
        </Link>
        <ArticleCardActions article={article} />
      </div>
    </section>
  );
}

function SideMiniCard({ article }: { article: NewsArticle }) {
  return (
    <div className="space-y-2">
      <p className="text-[12px] font-semibold text-[var(--text-main)]">{resolvePrimaryTag(article)}</p>
      <div className="space-y-3">
        <Link href={getEditorialArticlePath(article)} className="block space-y-3">
          <div className="overflow-hidden rounded-[12px] bg-[#27624f]">
            <AppImage alt={article.title} src={article.imageUrl || DEFAULT_IMAGE} responsiveSources={article.imageSources} sizes="(min-width: 1280px) 152px, (min-width: 640px) 25vw, 50vw" withLoader className="h-[151px] w-full object-cover transition-transform duration-700 ease-[var(--motion-ease-standard)] hover:scale-[1.02]" />
          </div>
          <h4 className="font-[Georgia] text-[12px] font-bold leading-[1.3] text-[var(--text-main)] hover:text-[#27624f]">{toPlainText(article.title, 75)}</h4>
        </Link>
        <ArticleCardActions article={article} />
      </div>
    </div>
  );
}

export function SideMiniGrid({ articles, className = "" }: { articles: NewsArticle[]; className?: string }) {
  if (!articles.length) return null;

  return (
    <div className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-2 ${className}`.trim()}>
      {articles.slice(0, 2).map((article) => (
        <SideMiniCard key={article.id} article={article} />
      ))}
    </div>
  );
}

// Les encarts sont pilotes par le gestionnaire de publicites : `AdSlot` gere
// lui-meme le cas ou l'emplacement est vide, il n'y a plus de visuel de
// remplacement code en dur.
// Le fil est rendu par le composant partage avec la page d accueil, pour que
// les deux surfaces ne divergent ni en donnees ni en presentation.
export function BriefList({ title, articles }: { title: string; articles: NewsArticle[] }) {
  return <NewsTicker title={title} articles={articles} autoScroll />;
}

export function HorizontalAds({ className = "", index = 0 }: { className?: string; index?: number }) {
  return (
    <AdSlot
      slotKey="newsInline"
      index={index}
      className={`news-ad-slot overflow-hidden rounded-[12px] bg-[var(--surface-1)] px-0 py-3 ${className}`.trim()}
    />
  );
}

function BottomSimpleList({ items, fallbackArticle }: { items: NewsArticle[]; fallbackArticle: NewsArticle }) {
  if (!items.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex h-[30px] items-center overflow-x-auto text-[10px] text-[var(--text-muted)]">
        {items.slice(0, 8).map((item, index) => (
          <span key={item.id} className="whitespace-nowrap">
            {index > 0 ? <span className="mx-4"> </span> : null}
            {resolvePrimaryTag(item)}
          </span>
        ))}
      </div>
      <div className="h-px bg-[var(--border-strong)]" />
      <InteractiveEditorialStories articles={items} fallbackArticle={fallbackArticle} />
    </div>
  );
}

export function NewsLandingPage({
  articles,
  taxonomyCategories,
  selectedCategory,
  editorialSections = [],
  newsFeed = [],
  featuredArticles = [],
  dataUnavailable = false,
}: {
  articles: NewsArticle[];
  taxonomyCategories?: Array<{ slug: string; label: string; uri?: string }>;
  selectedCategory?: string | null;
  editorialSections?: NewsEditorialSection[];
  newsFeed?: NewsArticle[];
  featuredArticles?: NewsArticle[];
  dataUnavailable?: boolean;
}) {
  const categories = buildCategoryStats(articles);
  const categoryItems = (taxonomyCategories?.length
    ? taxonomyCategories
    : categories.map(({ slug, label }) => ({ slug, label })));
  const filteredArticles = selectedCategory ? articles.filter((article) => article.category === selectedCategory) : articles;
  const activeCategory = categories.find((entry) => entry.slug === selectedCategory) ?? null;

  if (!filteredArticles.length) {
    return (
      <div className="news-public-page mx-auto max-w-[1141px] space-y-6 px-4 pb-12 pt-6 lg:px-0">
        <NewsCategoryRail categories={categoryItems} selectedCategory={selectedCategory} />
        {dataUnavailable ? (
          <PublicUnavailableState
            compact
            title="Les actualités sont temporairement indisponibles"
            description="Réessayez dans quelques instants pour consulter le flux éditorial."
          />
        ) : (
          <div className="py-20 text-center">
            <p className="text-[12px] uppercase tracking-[0.2em] text-[#27624f]">Actualites</p>
            <h1 className="mt-4 font-[Georgia] text-[38px] font-bold text-[var(--text-main)]">Aucun article dans cette rubrique</h1>
          </div>
        )}
      </div>
    );
  }

  const primaryArticles = selectedCategory
    ? filteredArticles
    : featuredArticles.length > 0
      ? featuredArticles
      : filteredArticles;
  const primaryLead = primaryArticles[3] ?? primaryArticles[2] ?? filteredArticles[0];
  const tickerArticles = newsFeed.length > 0 ? newsFeed : filteredArticles.slice(0, 10);
  const sections = selectedCategory ? [] : editorialSections;

  return (
    <div className="news-public-page mx-auto max-w-[1141px] space-y-8 px-4 pb-16 pt-6 lg:px-0">
      <NewsCategoryRail categories={categoryItems} selectedCategory={selectedCategory} />

      {dataUnavailable ? (
        <PublicUnavailableState
          compact
          title="Une partie des actualités est indisponible"
          description="Les contenus déjà disponibles restent affichés. Réessayez dans quelques instants pour actualiser le flux complet."
        />
      ) : null}

      <section className="grid gap-[19px] xl:grid-cols-[793px_329px]">
        <div className="flex flex-col gap-6">
          <EditorialStrip
            title={selectedCategory ? (activeCategory?.label ?? "Actualités") : "Breaking"}
            articles={primaryArticles}
            fallbackArticle={filteredArticles[0]}
          />
          <HorizontalAds index={0} />
        </div>

        <aside className="flex flex-col gap-6">
          {primaryLead ? <SideFeature title="À la une" article={primaryLead} /> : null}
          <SideMiniGrid articles={primaryArticles.slice(4, 6)} />
        </aside>
      </section>

      {sections.map((section, index) => {
        const showsNewsFeed = index === 0;
        const lead = section.articles[3] ?? section.articles[2] ?? section.articles[0];
        const isRecommendations = section.key === "recommandations";
        // Breaking compte comme première section : le premier séparateur est
        // donc placé après Politique, puis après chaque paire suivante.
        const showsSectionBreakAd = index % 2 === 0;

        return (
          <section key={section.key} className="grid gap-[19px] xl:grid-cols-[793px_329px]">
            <div className="flex flex-col gap-6">
              <EditorialStrip
                title={section.title}
                articles={section.articles}
                fallbackArticle={filteredArticles[0]}
              />
              <HorizontalAds index={index + 1} />
            </div>

            {showsNewsFeed ? (
              <aside className="flex flex-col gap-6">
                {lead ? <SideFeature title={isRecommendations ? "Reportages" : section.title} article={lead} /> : null}
                <BriefList title="Brèves fil info Madagascar" articles={tickerArticles} />
              </aside>
            ) : (
              <aside className="flex flex-col gap-6">
                {lead ? <SideFeature title={isRecommendations ? "Reportages" : section.title} article={lead} /> : null}
                <SideMiniGrid articles={section.articles.slice(4, 6)} />
              </aside>
            )}

            {showsSectionBreakAd ? <AdSlot slotKey="newsSectionBreak" index={Math.floor(index / 2)} className="xl:col-span-2 w-full" /> : null}
          </section>
        );
      })}
    </div>
  );
}


