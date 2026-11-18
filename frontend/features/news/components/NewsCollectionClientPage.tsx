"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { NewsCategoryRail } from "@/features/news/components/NewsCategoryRail";
import { EditorialStrip, HorizontalAds, SideFeature, SideMiniGrid } from "@/features/news/components/NewsLandingPage";
import type { NewsArticle, NewsCollectionPageResult } from "@/features/news/types";
import type { NewsFooterTaxonomyItem } from "@/features/news/data/news.repository";
import { normalizeEditorialUriToPath } from "@/features/news/lib/editorial-permalinks";

type NewsCollectionClientPageProps = {
  title: string;
  eyebrow: string;
  description: string;
  endpoint: string;
  emptyMessage: string;
  currentPage: number;
  mode: "archive" | "category" | "tag";
  archiveYear?: string;
  archiveMonth?: string;
  selectedCategorySlug?: string | null;
  categoryPath?: string | null;
};

type RouteState = {
  mode: "archive" | "category" | "tag";
  page: number;
  endpoint: string;
  title: string;
  eyebrow: string;
  description: string;
  selectedCategorySlug: string | null;
  categoryPath: string | null;
};

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

function humanizeSlug(value: string) {
  return decodeHtmlEntities(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildCategoryTitle(label: string) {
  return `Categorie : ${label}`;
}

function buildCategoryDescription(label: string) {
  return `Retrouvez les articles classes dans la rubrique ${label} sans recharger tout le flux editorial.`;
}

function buildTagTitle(label: string) {
  return `Tag : ${label}`;
}

function buildTagDescription(label: string) {
  return `Retrouvez les articles relies au tag ${label} dans le meme format editorial que les archives.`;
}

function buildArchiveTitle(month?: string, year?: string) {
  if (!month || !year) {
    return "Archives";
  }

  return `Archives ${month}/${year}`;
}

function buildArchiveDescription() {
  return "Consultez les articles publies sur cette periode dans une vue editoriale plus fluide.";
}

function getEditorialSectionTitle(title: string, mode: RouteState["mode"]) {
  return mode === "category" ? title.replace(/^Categorie\s*:\s*/i, "").trim() || "Actualités" : title;
}

function CategoryEditorialFeed({ articles, title }: { articles: NewsArticle[]; title: string }) {
  const groups = Array.from({ length: Math.ceil(articles.length / 6) }, (_, index) => articles.slice(index * 6, index * 6 + 6));

  return (
    <div className="space-y-8">
      {groups.map((group, index) => {
        const sideLead = group[3] ?? group[2] ?? group[0];

        return (
          <section key={group[0]?.id ?? index} className="grid gap-[19px] xl:grid-cols-[793px_329px]">
            <div className="flex flex-col gap-6">
              <EditorialStrip title={index === 0 ? title : "À suivre"} articles={group} fallbackArticle={articles[0]} />
              <HorizontalAds />
            </div>
            <aside className="flex flex-col gap-6">
              {sideLead ? <SideFeature title="À la une" article={sideLead} /> : null}
              <SideMiniGrid articles={group.slice(4, 6)} />
            </aside>
          </section>
        );
      })}
    </div>
  );
}

function parsePositivePage(value: string | null | undefined, fallback = 1) {
  const parsed = Number.parseInt(String(value || fallback), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function parseRouteStateFromLocation(
  pathname: string,
  search: string,
  categories: NewsFooterTaxonomyItem[],
  fallback: RouteState,
): RouteState {
  const query = new URLSearchParams(search);
  const page = parsePositivePage(query.get("page"), 1);

  const categoryMatch = pathname.match(/^\/category\/(.+)\/?$/);
  if (categoryMatch) {
    const categoryPath = categoryMatch[1]
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment).trim())
      .filter(Boolean)
      .join("/");
    const slug = categoryPath.split("/").pop() || "";
    const category = categories.find((item) => item.slug === slug);
    const label = category?.label ?? humanizeSlug(slug);

    return {
      mode: "category",
      page,
      endpoint: `/api/news/category/${categoryPath.split("/").map(encodeURIComponent).join("/")}`,
      title: buildCategoryTitle(label),
      eyebrow: "Categorie",
      description: buildCategoryDescription(label),
      selectedCategorySlug: slug,
      categoryPath,
    };
  }

  const tagMatch = pathname.match(/^\/tag\/(.+)\/?$/);
  if (tagMatch) {
    const slug = decodeURIComponent(tagMatch[1].split("/").filter(Boolean).pop() || "").trim();
    const label = humanizeSlug(slug);

    return {
      mode: "tag",
      page,
      endpoint: `/api/news/tag/${encodeURIComponent(slug)}`,
      title: buildTagTitle(label),
      eyebrow: "Tag",
      description: buildTagDescription(label),
      selectedCategorySlug: null,
      categoryPath: null,
    };
  }

  const archiveMatch = pathname.match(/^\/(\d{4})\/(\d{2})\/?$/);
  if (archiveMatch) {
    const [, year, month] = archiveMatch;

    return {
      mode: "archive",
      page,
      endpoint: `/api/news/archive/${year}/${month}`,
      title: buildArchiveTitle(month, year),
      eyebrow: "Archives",
      description: buildArchiveDescription(),
      selectedCategorySlug: null,
      categoryPath: null,
    };
  }

  return fallback;
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
        <div className="h-[380px] animate-pulse rounded-[20px] bg-[var(--surface-2)]" />
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[182px] animate-pulse rounded-[20px] bg-[var(--surface-2)]" />
          ))}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-[320px] animate-pulse rounded-[20px] bg-[var(--surface-2)]" />
        ))}
      </div>
    </div>
  );
}

export function NewsCollectionClientPage({
  title,
  eyebrow,
  description,
  endpoint,
  emptyMessage,
  currentPage,
  mode,
  archiveYear,
  archiveMonth,
  selectedCategorySlug = null,
  categoryPath = null,
}: NewsCollectionClientPageProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<NewsCollectionPageResult | null>(null);
  const [categories, setCategories] = useState<NewsFooterTaxonomyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [routeState, setRouteState] = useState<RouteState>({
    mode,
    page: currentPage,
    endpoint,
    title,
    eyebrow,
    description,
    selectedCategorySlug,
    categoryPath,
  });

  useEffect(() => {
    setRouteState({
      mode,
      page: currentPage,
      endpoint,
      title,
      eyebrow,
      description,
      selectedCategorySlug,
      categoryPath,
    });
  }, [categoryPath, currentPage, description, endpoint, eyebrow, mode, selectedCategorySlug, title]);

  useEffect(() => {
    let isMounted = true;

    async function loadTaxonomy() {
      try {
        const response = await fetch("/api/news/footer-taxonomy", { cache: "no-store" });
        const taxonomyPayload = (await response.json()) as { categories?: NewsFooterTaxonomyItem[] };

        if (!isMounted) {
          return;
        }

        const nextCategories = taxonomyPayload.categories ?? [];
        setCategories(nextCategories);
        setRouteState((current) =>
          parseRouteStateFromLocation(pathname ?? "/actualites", window.location.search, nextCategories, current),
        );
      } catch {
        if (isMounted) {
          setCategories([]);
        }
      }
    }

    loadTaxonomy();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      setRouteState((current) =>
        parseRouteStateFromLocation(window.location.pathname, window.location.search, categories, current),
      );
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [categories]);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const collectionResponse = await fetch(`${routeState.endpoint}?page=${routeState.page}&perPage=12`, {
          cache: "no-store",
        });

        const collectionPayload = (await collectionResponse.json()) as NewsCollectionPageResult & { error?: string };
        if (!collectionResponse.ok) {
          throw new Error(collectionPayload.error || "Impossible de charger les articles.");
        }

        if (!isMounted) {
          return;
        }

        setPayload(collectionPayload);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPayload({
          articles: [],
          pagination: {
            page: routeState.page,
            perPage: 12,
            hasNextPage: false,
          },
        });
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les articles.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [routeState.endpoint, routeState.page]);

  const collectionArticles = payload?.articles ?? [];

  const railCategories = useMemo(
    () =>
      categories.map((category) => ({
        slug: category.slug,
        label: category.label,
        href: normalizeEditorialUriToPath(category.uri ?? `/category/${category.slug}/`),
      })),
    [categories],
  );

  function updateBrowserUrl(nextPath: string, nextPage: number) {
    const query = nextPage > 1 ? `?page=${nextPage}` : "";
    window.history.pushState({}, "", `${nextPath}${query}`);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1) {
      return;
    }

    const basePath =
      routeState.mode === "category" && routeState.selectedCategorySlug
        ? `/category/${(routeState.categoryPath ?? routeState.selectedCategorySlug).split("/").map(encodeURIComponent).join("/")}`
        : routeState.mode === "tag"
          ? pathname ?? "/actualites"
        : archiveYear && archiveMonth
          ? `/${archiveYear}/${archiveMonth}`
          : pathname ?? "/actualites";

    updateBrowserUrl(basePath, nextPage);
    setRouteState((current) => ({
      ...current,
      page: nextPage,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCategorySelect(category: { slug: string; label: string; href?: string } | null) {
    if (!category) {
      window.location.href = "/actualites";
      return;
    }

    const nextTitle = buildCategoryTitle(category.label);
    const nextDescription = buildCategoryDescription(category.label);
    const nextPath = category.href ?? `/category/${encodeURIComponent(category.slug)}`;
    const nextCategoryPath = nextPath
      .replace(/^\/category\/?/, "")
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment).trim())
      .filter(Boolean)
      .join("/") || category.slug;

    updateBrowserUrl(nextPath, 1);
    setRouteState({
      mode: "category",
      page: 1,
      endpoint: `/api/news/category/${nextCategoryPath.split("/").map(encodeURIComponent).join("/")}`,
      title: nextTitle,
      eyebrow: "Categorie",
      description: nextDescription,
      selectedCategorySlug: category.slug,
      categoryPath: nextCategoryPath,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const access = payload?.access;
  const editorialSectionTitle = getEditorialSectionTitle(routeState.title, routeState.mode);
  // A route-state refresh can briefly finish before its replacement request
  // supplies data. Keep the editorial skeleton visible during that gap.
  const shouldShowLoading = isLoading || (!payload && !errorMessage);

  return (
    <div className="news-public-page mx-auto max-w-[1141px] space-y-8 px-4 pb-16 pt-6 lg:px-0">
      <NewsCategoryRail
        categories={railCategories}
        selectedCategory={routeState.selectedCategorySlug}
        onSelectCategory={handleCategorySelect}
      />

      {shouldShowLoading ? <LoadingState /> : null}

      {!shouldShowLoading && errorMessage ? (
        <div className="rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-1)] px-6 py-10 text-center text-[var(--text-muted)]">
          {errorMessage}
        </div>
      ) : null}

      {!shouldShowLoading && !errorMessage ? (
        <>
          {collectionArticles.length ? (
            <CategoryEditorialFeed articles={collectionArticles} title={editorialSectionTitle} />
          ) : (
            <div className="rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-1)] px-6 py-10 text-center text-[var(--text-muted)]">
              {emptyMessage}
            </div>
          )}

          {access?.isLimited ? (
            <section className="rounded-[20px] border border-[#27624f]/20 bg-[#fff7f7] px-5 py-5 text-[#3a1719] dark:bg-[#2a1c1f] dark:text-[#ffd9dc] sm:px-6">
              <p className="text-sm font-semibold">Archives et catégories en aperçu</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f3b40] dark:text-[#f0b9bd]">{access.message}</p>
              {access.actionHref && access.actionLabel ? (
                <a
                  href={access.actionHref}
                  className="mt-4 inline-flex rounded-full bg-[#27624f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ae1922]"
                >
                  {access.actionLabel}
                </a>
              ) : null}
            </section>
          ) : null}

          {payload ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => handlePageChange((payload.pagination.page || 1) - 1)}
                disabled={(payload.pagination.page || 1) <= 1}
                className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-1)] px-4 py-2 text-[12px] font-semibold text-[var(--text-main)] transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Precedent
              </button>
              <button
                type="button"
                onClick={() => handlePageChange((payload.pagination.page || 1) + 1)}
                disabled={!payload.pagination.hasNextPage}
                className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-1)] px-4 py-2 text-[12px] font-semibold text-[var(--text-main)] transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}


