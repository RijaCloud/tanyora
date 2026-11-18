import { SITE_URL } from "@/app/metadata";
import { getWordPressSitemapListings } from "@/lib/api/wordpress-internal";
import { getNewsFooterTaxonomy, listSitemapEditorialArticles } from "@/features/news/data/news.repository";
import { getEditorialArticlePath, normalizeEditorialUriToPath } from "@/features/news/lib/editorial-permalinks";

const EDITORIAL_SITEMAP_PAGE_SIZE = 5_000;
const LISTING_SITEMAP_PAGE_SIZE = 1_000;

export type SitemapEntry = {
  url: string;
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
};

export type SitemapSection = "static" | "editorial" | "classified" | "job" | "tender";

function absoluteUrl(path: string) {
  return new URL(path, `${SITE_URL}/`).toString();
}

function chunk<T>(items: T[], page: number, size: number) {
  return items.slice((page - 1) * size, page * size);
}

function pageCount(total: number, size: number) {
  return Math.max(1, Math.ceil(total / size));
}

export async function getStaticSitemapEntries(): Promise<SitemapEntry[]> {
  const routes = ["/", "/actualites", "/news", "/petites-annonces", "/offres-emploi", "/appels-offres", "/annuaire", "/radio", "/tarifs"];
  const taxonomy = await getNewsFooterTaxonomy().catch(() => ({ categories: [], tags: [] }));
  const taxonomyEntries = [...taxonomy.categories, ...taxonomy.tags].map((item) => ({
    url: absoluteUrl(normalizeEditorialUriToPath(item.uri)),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return Array.from(
    new Map([
      ...routes.map((path) => ({
        url: absoluteUrl(path),
        changeFrequency: path === "/" || path === "/actualites" || path === "/news" ? ("daily" as const) : ("weekly" as const),
        priority: path === "/" ? 1 : 0.8,
      })),
      ...taxonomyEntries,
    ].map((entry) => [entry.url, entry])).values(),
  );
}

export async function getEditorialSitemapEntries(): Promise<SitemapEntry[]> {
  const articles = await listSitemapEditorialArticles();
  const articleEntries = articles.map((article) => ({
    url: absoluteUrl(getEditorialArticlePath(article)),
    lastModified: article.modifiedAt || article.publishedAt,
    changeFrequency: article.source === "news" ? ("daily" as const) : ("weekly" as const),
    priority: article.source === "news" ? 0.7 : 0.8,
  }));
  const authorEntries = articles
    .filter((article) => article.authorSlug)
    .map((article) => ({ url: absoluteUrl(`/author/${encodeURIComponent(article.authorSlug || "")}`), changeFrequency: "weekly" as const, priority: 0.5 }));
  const archiveEntries = articles.map((article) => {
    const date = new Date(article.publishedAt);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return { url: absoluteUrl(`/${year}/${month}`), changeFrequency: "monthly" as const, priority: 0.4 };
  });

  return Array.from(new Map([...articleEntries, ...authorEntries, ...archiveEntries].map((entry) => [entry.url, entry])).values());
}

export async function getSitemapSectionPage(section: SitemapSection, page: number): Promise<SitemapEntry[]> {
  if (page < 1 || !Number.isInteger(page)) {
    return [];
  }
  if (section === "static") {
    return page === 1 ? getStaticSitemapEntries() : [];
  }
  if (section === "editorial") {
    return chunk(await getEditorialSitemapEntries(), page, EDITORIAL_SITEMAP_PAGE_SIZE);
  }

  const result = await getWordPressSitemapListings(section, { page, perPage: LISTING_SITEMAP_PAGE_SIZE });
  const prefix = section === "classified" ? "/petites-annonces" : section === "job" ? "/offres-emploi" : "/appels-offres";
  return result.items.map((item) => ({
    url: absoluteUrl(`${prefix}/${encodeURIComponent(item.slug)}`),
    lastModified: item.lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
}

export async function getSitemapSections(): Promise<Array<{ section: SitemapSection; pages: number }>> {
  const [editorialEntries, classified, job, tender] = await Promise.all([
    getEditorialSitemapEntries(),
    getWordPressSitemapListings("classified", { page: 1, perPage: LISTING_SITEMAP_PAGE_SIZE }),
    getWordPressSitemapListings("job", { page: 1, perPage: LISTING_SITEMAP_PAGE_SIZE }),
    getWordPressSitemapListings("tender", { page: 1, perPage: LISTING_SITEMAP_PAGE_SIZE }),
  ]);
  return [
    { section: "static", pages: 1 },
    { section: "editorial", pages: pageCount(editorialEntries.length, EDITORIAL_SITEMAP_PAGE_SIZE) },
    { section: "classified", pages: Math.max(1, classified.pagination.totalPages) },
    { section: "job", pages: Math.max(1, job.pagination.totalPages) },
    { section: "tender", pages: Math.max(1, tender.pagination.totalPages) },
  ];
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] || character);
}

export function sitemapXml(entries: SitemapEntry[]) {
  const body = entries.map((entry) => [
    "<url>",
    `<loc>${escapeXml(entry.url)}</loc>`,
    entry.lastModified ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>` : "",
    entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : "",
    typeof entry.priority === "number" ? `<priority>${entry.priority.toFixed(1)}</priority>` : "",
    "</url>",
  ].filter(Boolean).join("")).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function sitemapIndexXml(locations: string[]) {
  const body = locations.map((location) => `<sitemap><loc>${escapeXml(location)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export function sitemapSectionUrl(section: SitemapSection, page: number) {
  return absoluteUrl(`/sitemaps/${section}/${page}.xml`);
}
