import { mockArticles } from "@/features/news/data/mock-news";
import { registerNewsCategory } from "@/features/news/data/category-analytics";
import type { EditorialHome, NewsArticle, NewsCollectionPageResult, NewsEditorialSection, NewsImageSource } from "@/features/news/types";
import { getWordPressPublicSiteConfig } from "@/lib/api/wordpress-internal";
import { cacheStore } from "@/lib/cache";
import { wpGraphqlRequest } from "@/lib/graphql/client";
import { cache } from "react";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";

const useMocks = (process.env.USE_NEWS_MOCKS ?? "false") === "true";
export const NEWS_REVALIDATE_SECONDS = 300;
const ARTICLE_DETAIL_ACCESS_REVALIDATE_SECONDS = 60 * 60;
const DEFAULT_EDITORIAL_GRAPHQL_URL = "https://2424-backup.winfordcap.com/graphql";
const EDITORIAL_CURSOR_CACHE_TTL_SECONDS = 60 * 60;
const EDITORIAL_CURSOR_VERSION_TTL_SECONDS = 24 * 60 * 60;
const EDITORIAL_CURSOR_VERSION_KEY = "news:editorial-cursor-version";
const EDITORIAL_SNAPSHOT_VERSION_KEY = "news:editorial-snapshot-version";
const EDITORIAL_SNAPSHOT_TTL_SECONDS = 60 * 60;
const EDITORIAL_SITEMAP_SNAPSHOT_TTL_SECONDS = 7 * 24 * 60 * 60;
const editorialSnapshotRequests = new Map<string, Promise<unknown>>();
const GRAPHQL_CAPABILITY_TTL_SECONDS = 24 * 60 * 60;
const MINIMUM_PLAN_CAPABILITY_KEY = "news:graphql-capability:minimum-plan";
const FLASH_SOURCE_CAPABILITY_KEY = "news:graphql-capability:flash-source";

type WpPostNode = {
  id: string;
  databaseId?: number | null;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  modified?: string;
  minimumPlanRequired?: "all" | "essentiel" | "business" | null;
  isPaid?: boolean | null;
  previewParagraphs?: number | null;
  previewSpaces?: number | null;
  commentCount?: number | null;
  viewCount?: number | null;
  commentsOpen?: boolean | null;
  flashSourcePostId?: number | null;
  flashSourceArticle?: {
    slug?: string | null;
  } | null;
  featuredImage?: {
    node?: {
      sourceUrl?: string;
      mediaDetails?: {
        width?: number | string | null;
        height?: number | string | null;
        sizes?: Array<{
          sourceUrl?: string | null;
          width?: number | string | null;
          height?: number | string | null;
        } | null> | null;
      } | null;
    };
  };
  categories?: {
    nodes?: Array<{ slug: string; name?: string; uri?: string }>;
  };
  tags?: {
    nodes?: Array<{ slug: string; name?: string; uri?: string }>;
  };
  author?: {
    node?: {
      slug?: string;
      name?: string;
      uri?: string;
    };
  };
};

type WpPostConnection = {
  nodes: WpPostNode[];
  pageInfo?: {
    hasNextPage?: boolean | null;
    endCursor?: string | null;
  } | null;
};

type WpNewsConnection = {
  nodes: WpPostNode[];
  pageInfo?: {
    hasNextPage?: boolean | null;
    endCursor?: string | null;
  } | null;
};

type WpTaxonomyNode = {
  slug?: string | null;
  name?: string | null;
  count?: number | null;
  uri?: string | null;
  link?: string | null;
};

type WpTaxonomyConnection = {
  nodes?: WpTaxonomyNode[] | null;
  pageInfo?: {
    hasNextPage?: boolean | null;
    endCursor?: string | null;
  } | null;
};

export type EditorialLandingData = {
  articles: NewsArticle[];
  taxonomy: NewsFooterTaxonomy;
  newsFeed: NewsCollectionPageResult;
  featured: NewsCollectionPageResult;
  editorialSections: NewsEditorialSection[];
};

export type NewsFooterTaxonomyItem = {
  slug: string;
  label: string;
  count: number;
  uri?: string;
};

export type NewsFooterTaxonomy = {
  categories: NewsFooterTaxonomyItem[];
  tags: NewsFooterTaxonomyItem[];
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

const WP_FEATURED_IMAGE_FIELDS = `
  featuredImage {
    node {
      sourceUrl
      mediaDetails {
        width
        height
        sizes {
          sourceUrl
          width
          height
        }
      }
    }
  }
`;

/** Champs reserves a la fiche article : les compteurs et le HTML complet sont
 * volontairement exclus des cartes pour eviter un resolveur couteux par ligne. */
const WP_ARTICLE_DETAIL_FIELDS_WITH_PLAN = `
  id
  databaseId
  slug
  title
  excerpt
  content
  date
  modified
  minimumPlanRequired
  isPaid: platformIsPaid
  previewParagraphs: platformPreviewParagraphs
  previewSpaces: platformPreviewSpaces
  commentCount: platformCommentCount
  viewCount: platformViewCount
  commentsOpen: platformCommentsOpen
  ${WP_FEATURED_IMAGE_FIELDS}
  categories {
    nodes {
      slug
      name
      uri
    }
  }
  tags {
    nodes {
      slug
      name
      uri
    }
  }
  author {
    node {
      name
    }
  }
`;

const WP_ARTICLE_DETAIL_FIELDS_WITHOUT_PLAN = `
  id
  databaseId
  slug
  title
  excerpt
  content
  date
  modified
  ${WP_FEATURED_IMAGE_FIELDS}
  categories {
    nodes {
      slug
      name
      uri
    }
  }
  tags {
    nodes {
      slug
      name
      uri
    }
  }
  author {
    node {
      name
    }
  }
`;

/** Champs communs aux cartes home, listes, archives et contenus lies. */
const WP_ARTICLE_SUMMARY_FIELDS = `
  id
  databaseId
  slug
  title
  excerpt
  date
  modified
  ${WP_FEATURED_IMAGE_FIELDS}
  categories {
    nodes {
      slug
      name
      uri
    }
  }
  tags {
    nodes {
      slug
      name
      uri
    }
  }
  author {
    node {
      name
    }
  }
`;

/**
 * L'accueil est charge cote client apres le shell de la page. Ne demander que
 * les donnees effectivement affichees pour garder ce premier flux leger.
 */
const WP_HOME_ARTICLE_FIELDS = `
  id
  slug
  title
  excerpt
  date
  ${WP_FEATURED_IMAGE_FIELDS}
  categories {
    nodes {
      slug
      name
      uri
    }
  }
`;

/** Le CPT news est volontairement plus léger que les articles : il alimente
 * exclusivement le fil d'information et n'a pas besoin des taxonomies. */
const WP_NEWS_LEGACY_TICKER_FIELDS = `
  id
  slug
  title
  date
`;

const WP_NEWS_TICKER_FIELDS = `
  ${WP_NEWS_LEGACY_TICKER_FIELDS}
  flashSourcePostId
  flashSourceArticle {
    slug
  }
`;

function getWpNewsDetailFields(includeFlashSource: boolean) {
  return `
  ${includeFlashSource ? WP_NEWS_TICKER_FIELDS : WP_NEWS_LEGACY_TICKER_FIELDS}
  content
`;
}

function decodeNewsText(value?: string | null) {
  if (!value) {
    return "";
  }

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

function normalizeNewsText(value?: string | null) {
  return decodeNewsText(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

function isMissingMinimumPlanFieldError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('Cannot query field "minimumPlanRequired"') ||
    error.message.includes('Cannot query field "platformIsPaid"') ||
    error.message.includes('Cannot query field "platformPreviewParagraphs"') ||
    error.message.includes('Cannot query field "platformPreviewSpaces"') ||
    error.message.includes('Cannot query field "platformCommentCount"') ||
    error.message.includes('Cannot query field "platformViewCount"') ||
    error.message.includes('Cannot query field "platformCommentsOpen"')
  );
}

function isMissingNewsPostTypeError(error: unknown) {
  return error instanceof Error && error.message.includes('Cannot query field "newsItems"');
}

function isMissingFlashSourceFieldsError(error: unknown) {
  return error instanceof Error && (
    error.message.includes('Cannot query field "flashSourcePostId"') ||
    error.message.includes('Cannot query field "flashSourceArticle"')
  );
}

function isRecoverableEditorialSourceError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("fetch failed") ||
    message.includes("connect") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("network")
  );
}

async function requestWithMinimumPlanFallback<T>(
  primaryQuery: string,
  fallbackQuery: string,
  variables: Record<string, unknown> | undefined,
  cacheOptions: { tags: string[]; revalidate: number },
  endpoint: string,
) {
  const knownSupport = await cacheStore.get<boolean>(MINIMUM_PLAN_CAPABILITY_KEY);
  if (knownSupport === false) {
    return wpGraphqlRequest<T>(fallbackQuery, variables, cacheOptions, endpoint);
  }

  try {
    const data = await wpGraphqlRequest<T>(primaryQuery, variables, cacheOptions, endpoint);
    await cacheStore.set(MINIMUM_PLAN_CAPABILITY_KEY, true, GRAPHQL_CAPABILITY_TTL_SECONDS);
    return data;
  } catch (error) {
    if (!isMissingMinimumPlanFieldError(error)) {
      throw error;
    }

    await cacheStore.set(MINIMUM_PLAN_CAPABILITY_KEY, false, GRAPHQL_CAPABILITY_TTL_SECONDS);
    return wpGraphqlRequest<T>(fallbackQuery, variables, cacheOptions, endpoint);
  }
}

const getEditorialGraphqlEndpoint = cache(async () => {
  try {
    const config = await getWordPressPublicSiteConfig();
    const configuredUrl = config.editorialSourceGraphqlUrl?.trim();
    if (configuredUrl) {
      return configuredUrl;
    }
  } catch {
    // Fall back below when the site config endpoint is temporarily unavailable.
  }

  return process.env.WP_GRAPHQL_URL?.trim() || DEFAULT_EDITORIAL_GRAPHQL_URL;
});

async function getEditorialCursorCacheVersion() {
  return (await cacheStore.get<number>(EDITORIAL_CURSOR_VERSION_KEY)) ?? 1;
}

async function getEditorialSnapshotVersion() {
  return (await cacheStore.get<number>(EDITORIAL_SNAPSHOT_VERSION_KEY)) ?? 1;
}

async function getEditorialSnapshot<T>(scope: string, loader: () => Promise<T>, ttlSeconds = EDITORIAL_SNAPSHOT_TTL_SECONDS): Promise<T> {
  const version = await getEditorialSnapshotVersion();
  const cacheKey = `news:editorial-snapshot:v${version}:${scope}`;
  const cached = await cacheStore.get<T>(cacheKey);
  if (cached !== null) return cached;

  const inFlight = editorialSnapshotRequests.get(cacheKey) as Promise<T> | undefined;
  if (inFlight) return inFlight;

  const request = loader().then(async (value) => {
    await cacheStore.set(cacheKey, value, ttlSeconds);
    return value;
  });
  editorialSnapshotRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    editorialSnapshotRequests.delete(cacheKey);
  }
}

function buildEditorialCursorCacheKey(version: number, scope: string, page: number) {
  return `news:editorial-cursor:v${version}:${scope}:page:${page}`;
}

async function getEditorialPageCursor(version: number, scope: string, page: number): Promise<string | null | undefined> {
  if (page <= 1) return null;
  const cursor = await cacheStore.get<string>(buildEditorialCursorCacheKey(version, scope, page));
  return cursor ?? undefined;
}

async function setEditorialPageCursor(version: number, scope: string, page: number, cursor: string) {
  await cacheStore.set(
    buildEditorialCursorCacheKey(version, scope, page),
    cursor,
    EDITORIAL_CURSOR_CACHE_TTL_SECONDS,
  );
}

/** Appelle lors d'un webhook editorial afin d'ignorer tous les curseurs precedents. */
export async function invalidateEditorialCursorCache() {
  await cacheStore.increment(EDITORIAL_CURSOR_VERSION_KEY, EDITORIAL_CURSOR_VERSION_TTL_SECONDS);
}

/** Invalidates composed public pages alongside the individual GraphQL cache. */
export async function invalidateEditorialSnapshots() {
  await cacheStore.increment(EDITORIAL_SNAPSHOT_VERSION_KEY, EDITORIAL_CURSOR_VERSION_TTL_SECONDS);
}

function toPositiveNumber(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getResponsiveImageSources(node: WpPostNode): NewsImageSource[] {
  const imageNode = node.featuredImage?.node;
  const originalWidth = toPositiveNumber(imageNode?.mediaDetails?.width);
  const originalHeight = toPositiveNumber(imageNode?.mediaDetails?.height);
  const originalAspectRatio = originalWidth && originalHeight ? originalWidth / originalHeight : undefined;
  const candidates = [
    ...(imageNode?.mediaDetails?.sizes ?? []),
    imageNode?.sourceUrl
      ? { sourceUrl: imageNode.sourceUrl, width: originalWidth, height: originalHeight }
      : null,
  ];
  const sources: NewsImageSource[] = [];

  for (const candidate of candidates) {
    const url = candidate?.sourceUrl?.trim();
    const width = toPositiveNumber(candidate?.width);
    const height = toPositiveNumber(candidate?.height);
    if (!url || !width || sources.some((source) => source.url === url)) continue;
    if (originalAspectRatio && height && Math.abs(width / height - originalAspectRatio) / originalAspectRatio > 0.08) continue;

    sources.push({ url, width, height });
  }

  return sources.sort((left, right) => left.width - right.width);
}

function mapWpPostToArticle(node: WpPostNode, source: NewsArticle["source"] = "post"): NewsArticle {
  const primaryCategory = node.categories?.nodes?.[0];
  const imageSources = source === "post" ? getResponsiveImageSources(node) : [];
  const imageNode = source === "post" ? node.featuredImage?.node : undefined;

  return {
    id: node.id,
    postId: typeof node.databaseId === "number" ? node.databaseId : undefined,
    source,
    slug: node.slug,
    flashSourcePostId: typeof node.flashSourcePostId === "number" ? node.flashSourcePostId : undefined,
    flashSourceSlug: source === "news" && node.flashSourceArticle?.slug
      ? decodeNewsText(node.flashSourceArticle.slug)
      : undefined,
    title: decodeNewsText(node.title),
    excerpt: node.excerpt,
    content: node.content ?? "",
    publishedAt: node.date,
    modifiedAt: node.modified,
    category: source === "news" ? "news" : decodeNewsText(primaryCategory?.slug ?? "general"),
    categoryLabel: source === "news" ? "Fil d'info" : decodeNewsText(primaryCategory?.name ?? "General"),
    categoryUri: source === "news" ? undefined : (primaryCategory?.uri ? decodeNewsText(primaryCategory.uri) : undefined),
    commentCount: typeof node.commentCount === "number" ? node.commentCount : 0,
    viewCount: typeof node.viewCount === "number" ? node.viewCount : 0,
    commentsOpen: node.commentsOpen !== false,
    isPaid: Boolean(node.isPaid),
    previewParagraphs: typeof node.previewParagraphs === "number" ? Math.max(0, node.previewParagraphs) : 0,
    previewSpaces: typeof node.previewSpaces === "number" ? Math.max(0, node.previewSpaces) : 0,
    tags: node.tags?.nodes?.map((tag) => decodeNewsText(tag.name || tag.slug)).filter(Boolean) ?? [],
    tagSlugs: node.tags?.nodes?.map((tag) => decodeNewsText(tag.slug)).filter(Boolean) ?? [],
    // Flash news is a text-only ticker entry. It can point to an editorial
    // article, but must never inherit or render that article's media.
    ...(source === "post" ? {
      imageUrl: imageNode?.sourceUrl,
      imageWidth: toPositiveNumber(imageNode?.mediaDetails?.width),
      imageHeight: toPositiveNumber(imageNode?.mediaDetails?.height),
      imageSources: imageSources.length ? imageSources : undefined,
    } : {}),
    authorName: decodeNewsText(node.author?.node?.name ?? "Tanyora"),
    authorSlug: decodeNewsText(node.author?.node?.slug ?? ""),
    authorUri: decodeNewsText(node.author?.node?.uri ?? ""),
    isPremium: (node.minimumPlanRequired ?? "all") !== "all",
    minimumPlanRequired: node.minimumPlanRequired ?? "all",
  };
}

async function getWpArticles(): Promise<NewsArticle[]> {
  const endpoint = await getEditorialGraphqlEndpoint();
  const query = `
    query LatestPosts {
      posts(first: 20) {
        nodes {
          ${WP_ARTICLE_SUMMARY_FIELDS}
        }
      }
    }
  `;

  const data = await wpGraphqlRequest<{ posts: { nodes: WpPostNode[] } }>(query, undefined, {
    tags: ["wp", "news", "wp:news"],
    revalidate: NEWS_REVALIDATE_SECONDS,
  }, endpoint);

  const articles = data.posts.nodes.map((node) => mapWpPostToArticle(node));

  await Promise.all(
    articles.map((article) => registerNewsCategory(article.category, article.categoryLabel)),
  );

  return articles;
}

async function getWpHomeArticles(): Promise<NewsArticle[]> {
  const endpoint = await getEditorialGraphqlEndpoint();
  const query = `
    query LatestHomePosts {
      posts(first: 9) {
        nodes {
          ${WP_HOME_ARTICLE_FIELDS}
        }
      }
    }
  `;

  const data = await wpGraphqlRequest<{ posts: { nodes: WpPostNode[] } }>(query, undefined, {
    tags: ["wp", "news", "wp:news", "wp:news:home"],
    revalidate: NEWS_REVALIDATE_SECONDS,
  }, endpoint);

  const articles = data.posts.nodes.map((node) => mapWpPostToArticle(node));

  await Promise.all(
    articles.map((article) => registerNewsCategory(article.category, article.categoryLabel)),
  );

  return articles;
}

async function getWpHomeFeaturedArticles(limit: number): Promise<NewsArticle[]> {
  const endpoint = await getEditorialGraphqlEndpoint();
  const query = `
    query HomeFeaturedPosts($first: Int!, $category: String!) {
      posts(first: $first, where: { categoryName: $category }) {
        nodes {
          ${WP_HOME_ARTICLE_FIELDS}
        }
      }
    }
  `;

  try {
    const data = await wpGraphqlRequest<{ posts: { nodes: WpPostNode[] } }>(
      query,
      { first: limit, category: HOME_FEATURED_CATEGORY_SLUG },
      {
        tags: ["wp", "news", "wp:news", "wp:news:home", "wp:news:category:une"],
        revalidate: NEWS_REVALIDATE_SECONDS,
      },
      endpoint,
    );

    return data.posts.nodes.map((node) => mapWpPostToArticle(node));
  } catch (error) {
    if (isRecoverableEditorialSourceError(error)) {
      return [];
    }

    throw error;
  }
}

async function getAllWpPostsByWhere(
  queryName: string,
  whereClause: string,
  variableValue: string,
  cacheTag: string,
): Promise<NewsArticle[]> {
  const endpoint = await getEditorialGraphqlEndpoint();
  const query = `
    query ${queryName}($first: Int!, $after: String, $value: String!) {
      posts(first: $first, after: $after, where: { ${whereClause}: $value }) {
        nodes {
          ${WP_ARTICLE_SUMMARY_FIELDS}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const fallbackQuery = `
    query ${queryName}($first: Int!, $after: String, $value: String!) {
      posts(first: $first, after: $after, where: { ${whereClause}: $value }) {
        nodes {
          ${WP_ARTICLE_SUMMARY_FIELDS}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const nodes: WpPostNode[] = [];
  let after: string | null = null;

  do {
    const variables: Record<string, unknown> = { first: 100, after, value: variableValue };
    const data = await requestWithMinimumPlanFallback<{ posts: WpPostConnection }>(
      query,
      fallbackQuery,
      variables,
      {
        tags: ["wp", "news", "wp:news", cacheTag],
        revalidate: NEWS_REVALIDATE_SECONDS,
      },
      endpoint,
    );

    nodes.push(...data.posts.nodes);
    after = data.posts.pageInfo?.hasNextPage ? (data.posts.pageInfo?.endCursor ?? null) : null;
  } while (after);

  return nodes.map((node) => mapWpPostToArticle(node));
}

async function getWpPostsPageByWhere(
  queryName: string,
  whereClause: string,
  variableValue: string,
  cacheTag: string,
  page = 1,
  perPage = 12,
): Promise<NewsCollectionPageResult> {
  const endpoint = await getEditorialGraphqlEndpoint();
  const query = `
    query ${queryName}($first: Int!, $after: String, $value: String!) {
      posts(first: $first, after: $after, where: { ${whereClause}: $value }) {
        nodes {
          ${WP_ARTICLE_SUMMARY_FIELDS}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const fallbackQuery = `
    query ${queryName}($first: Int!, $after: String, $value: String!) {
      posts(first: $first, after: $after, where: { ${whereClause}: $value }) {
        nodes {
          ${WP_ARTICLE_SUMMARY_FIELDS}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const normalizedPage = Math.max(page, 1);
  const normalizedPerPage = Math.max(perPage, 1);
  const cursorScope = `category-or-tag:${queryName}:${variableValue}:${normalizedPerPage}`;
  const cacheVersion = await getEditorialCursorCacheVersion();
  let currentPage = normalizedPage;
  let after = await getEditorialPageCursor(cacheVersion, cursorScope, normalizedPage);
  let hasNextPage = false;
  let endCursor: string | null = null;
  let nodes: WpPostNode[] = [];

  // Un parcours normal (page suivante) est une seule requete. Lors d'un acces
  // direct a une page froide, on amorce seulement les curseurs manquants, puis
  // les pages suivantes reutilisent le cache Redis partage entre workers.
  while (after === undefined && currentPage > 1) {
    currentPage -= 1;
    after = await getEditorialPageCursor(cacheVersion, cursorScope, currentPage);
  }

  after = after ?? null;
  do {
    const variables: Record<string, unknown> = { first: normalizedPerPage, after, value: variableValue };
    const data = await requestWithMinimumPlanFallback<{ posts: WpPostConnection }>(
      query,
      fallbackQuery,
      variables,
      {
        tags: ["wp", "news", "wp:news", cacheTag, `${cacheTag}:page:${currentPage}:${normalizedPerPage}`],
        revalidate: NEWS_REVALIDATE_SECONDS,
      },
      endpoint,
    );

    nodes = data.posts.nodes;
    hasNextPage = Boolean(data.posts.pageInfo?.hasNextPage);
    endCursor = data.posts.pageInfo?.endCursor ?? null;

    if (hasNextPage && endCursor) {
      await setEditorialPageCursor(cacheVersion, cursorScope, currentPage + 1, endCursor);
    }

    if (currentPage === normalizedPage || !hasNextPage || !endCursor) {
      break;
    }

    after = endCursor;
    currentPage += 1;
  } while (true);

  return {
    articles: nodes.map((node) => mapWpPostToArticle(node)),
    pagination: {
      page: normalizedPage,
      perPage: normalizedPerPage,
      hasNextPage: hasNextPage && Boolean(endCursor),
    },
  };
}

/**
 * `categoryName` est ambigu pour les chemins parent/enfant. Pour une
 * sous-categorie, WPGraphQL sait resoudre l'URI complete puis paginer
 * directement les publications rattachees a ce terme precis.
 */
async function getWpPostsPageByCategoryUri(
  categoryPath: string,
  page = 1,
  perPage = 12,
): Promise<NewsCollectionPageResult> {
  const endpoint = await getEditorialGraphqlEndpoint();
  const normalizedPath = categoryPath.split("/").map((segment) => segment.trim()).filter(Boolean).join("/");
  const categoryUri = `/category/${normalizedPath}/`;
  const query = `
    query PostsByCategoryUri($first: Int!, $after: String, $uri: ID!) {
      category(id: $uri, idType: URI) {
        posts(first: $first, after: $after) {
          nodes {
            ${WP_ARTICLE_SUMMARY_FIELDS}
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;
  const normalizedPage = Math.max(page, 1);
  const normalizedPerPage = Math.max(perPage, 1);
  const cursorScope = `category-uri:${normalizedPath}:${normalizedPerPage}`;
  const cacheVersion = await getEditorialCursorCacheVersion();
  let currentPage = normalizedPage;
  let after = await getEditorialPageCursor(cacheVersion, cursorScope, normalizedPage);
  let hasNextPage = false;
  let endCursor: string | null = null;
  let nodes: WpPostNode[] = [];

  while (after === undefined && currentPage > 1) {
    currentPage -= 1;
    after = await getEditorialPageCursor(cacheVersion, cursorScope, currentPage);
  }

  after = after ?? null;
  do {
    const data: { category?: { posts?: WpPostConnection | null } | null } = await wpGraphqlRequest<{ category?: { posts?: WpPostConnection | null } | null }>(
      query,
      { first: normalizedPerPage, after, uri: categoryUri },
      {
        tags: ["wp", "news", "wp:news", `wp:news:category:${normalizedPath}`, `wp:news:category:${normalizedPath}:page:${currentPage}:${normalizedPerPage}`],
        revalidate: NEWS_REVALIDATE_SECONDS,
      },
      endpoint,
    );
    const posts: WpPostConnection | null | undefined = data.category?.posts;
    nodes = posts?.nodes ?? [];
    hasNextPage = Boolean(posts?.pageInfo?.hasNextPage);
    endCursor = posts?.pageInfo?.endCursor ?? null;

    if (hasNextPage && endCursor) {
      await setEditorialPageCursor(cacheVersion, cursorScope, currentPage + 1, endCursor);
    }

    if (currentPage === normalizedPage || !hasNextPage || !endCursor) {
      break;
    }

    after = endCursor;
    currentPage += 1;
  } while (true);

  return {
    articles: nodes.map((node) => mapWpPostToArticle(node)),
    pagination: {
      page: normalizedPage,
      perPage: normalizedPerPage,
      hasNextPage: hasNextPage && Boolean(endCursor),
    },
  };
}

/** Le fil d'information est exclusivement alimente par le CPT WordPress news. */
export async function listNewsFeedPage(
  page = 1,
  perPage = 12,
  includeFlashSource = true,
): Promise<NewsCollectionPageResult> {
  if (useMocks) {
    return listByCategoryPage(HOME_NEWSFEED_CATEGORY_SLUG, page, perPage);
  }

  if (includeFlashSource && (await cacheStore.get<boolean>(FLASH_SOURCE_CAPABILITY_KEY)) === false) {
    return listNewsFeedPage(page, perPage, false);
  }

  const endpoint = await getEditorialGraphqlEndpoint();
  const normalizedPage = Math.max(page, 1);
  const normalizedPerPage = Math.max(perPage, 1);
  const cursorScope = `news-feed:${normalizedPerPage}`;
  const cacheVersion = await getEditorialCursorCacheVersion();
  let currentPage = normalizedPage;
  let after = await getEditorialPageCursor(cacheVersion, cursorScope, normalizedPage);

  while (after === undefined && currentPage > 1) {
    currentPage -= 1;
    after = await getEditorialPageCursor(cacheVersion, cursorScope, currentPage);
  }

  after = after ?? null;
  const query = `
    query NewsFeed($first: Int!, $after: String) {
      newsItems(first: $first, after: $after) {
        nodes {
          ${includeFlashSource ? WP_NEWS_TICKER_FIELDS : WP_NEWS_LEGACY_TICKER_FIELDS}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    let data: { newsItems: WpNewsConnection };
    do {
      data = await wpGraphqlRequest<{ newsItems: WpNewsConnection }>(
        query,
        { first: normalizedPerPage, after },
        {
          tags: ["wp", "news", "wp:news", "wp:news:ticker", `wp:news:ticker:page:${currentPage}:${normalizedPerPage}`],
          revalidate: NEWS_REVALIDATE_SECONDS,
        },
        endpoint,
      );

      if (includeFlashSource) {
        await cacheStore.set(FLASH_SOURCE_CAPABILITY_KEY, true, GRAPHQL_CAPABILITY_TTL_SECONDS);
      }

      const hasNextPage = Boolean(data.newsItems.pageInfo?.hasNextPage);
      const endCursor = data.newsItems.pageInfo?.endCursor ?? null;
      if (hasNextPage && endCursor) {
        await setEditorialPageCursor(cacheVersion, cursorScope, currentPage + 1, endCursor);
      }

      if (currentPage === normalizedPage || !hasNextPage || !endCursor) {
        return {
          articles: data.newsItems.nodes
            .map((node) => mapWpPostToArticle(node, "news"))
            .filter((article) => !article.flashSourcePostId || Boolean(article.flashSourceSlug)),
          pagination: {
            page: normalizedPage,
            perPage: normalizedPerPage,
            hasNextPage,
          },
        };
      }

      after = endCursor;
      currentPage += 1;
    } while (true);
  } catch (error) {
    if (includeFlashSource && isMissingFlashSourceFieldsError(error)) {
      await cacheStore.set(FLASH_SOURCE_CAPABILITY_KEY, false, GRAPHQL_CAPABILITY_TTL_SECONDS);
      return listNewsFeedPage(page, perPage, false);
    }

    if (isMissingNewsPostTypeError(error)) {
      return {
        articles: [],
        pagination: {
          page: normalizedPage,
          perPage: normalizedPerPage,
          hasNextPage: false,
        },
      };
    }

    throw error;
  }
}

/** Search stays on the summary fragment so the global overlay never loads article HTML. */
export async function searchNewsArticles(query: string, limit = 100): Promise<NewsArticle[]> {
  const normalizedQuery = query.trim();
  const normalizedLimit = Math.min(Math.max(limit, 1), 100);
  if (normalizedQuery.length < 2) {
    return [];
  }

  if (useMocks) {
    const needle = normalizedQuery.toLocaleLowerCase("fr");
    return (await listArticles())
      .filter((article) => [article.title, article.excerpt, article.category, ...(article.tags ?? [])]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(needle))
      .slice(0, normalizedLimit);
  }

  const endpoint = await getEditorialGraphqlEndpoint();
  const queryDocument = `
    query SearchEditorialPosts($first: Int!, $search: String!) {
      posts(first: $first, where: { search: $search }) {
        nodes {
          ${WP_ARTICLE_SUMMARY_FIELDS}
        }
      }
    }
  `;

  const data = await requestWithMinimumPlanFallback<{ posts: WpPostConnection }>(
    queryDocument,
    queryDocument,
    { first: normalizedLimit, search: normalizedQuery },
    {
      // Search terms are user input; only use stable cache tags that are safe to
      // invalidate after an editorial update.
      tags: ["wp", "news", "wp:news", "wp:news:search"],
      revalidate: NEWS_REVALIDATE_SECONDS,
    },
    endpoint,
  );

  return data.posts.nodes.map((node) => mapWpPostToArticle(node));
}

async function getWpArchivePage(
  year: string,
  month: string,
  page = 1,
  perPage = 12,
): Promise<NewsCollectionPageResult> {
  const endpoint = await getEditorialGraphqlEndpoint();
  const query = `
    query ArchivePosts($first: Int!, $after: String, $afterDate: DateInput!, $beforeDate: DateInput!) {
      posts(first: $first, after: $after, where: { dateQuery: { after: $afterDate, before: $beforeDate } }) {
        nodes {
          ${WP_ARTICLE_SUMMARY_FIELDS}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const fallbackQuery = `
    query ArchivePosts($first: Int!, $after: String, $afterDate: DateInput!, $beforeDate: DateInput!) {
      posts(first: $first, after: $after, where: { dateQuery: { after: $afterDate, before: $beforeDate } }) {
        nodes {
          ${WP_ARTICLE_SUMMARY_FIELDS}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const normalizedPage = Math.max(page, 1);
  const normalizedPerPage = Math.max(perPage, 1);
  const startDate = { year: Number(year), month: Number(month), day: 1 };
  const endDate = new Date(Date.UTC(startDate.year, startDate.month, 1));
  const beforeDate = { year: endDate.getUTCFullYear(), month: endDate.getUTCMonth() + 1, day: 1 };
  const cursorScope = `archive:${year}:${month}:${normalizedPerPage}`;
  const cacheVersion = await getEditorialCursorCacheVersion();
  let currentPage = normalizedPage;
  let after = await getEditorialPageCursor(cacheVersion, cursorScope, normalizedPage);

  while (after === undefined && currentPage > 1) {
    currentPage -= 1;
    after = await getEditorialPageCursor(cacheVersion, cursorScope, currentPage);
  }

  after = after ?? null;
  let nodes: WpPostNode[] = [];
  let hasNextPage = false;

  do {
    const data: { posts: WpPostConnection } = await requestWithMinimumPlanFallback<{ posts: WpPostConnection }>(
      query,
      fallbackQuery,
      { first: normalizedPerPage, after, afterDate: startDate, beforeDate },
      {
        tags: ["wp", "news", "wp:news", `wp:news:archive:${year}:${month}`, `wp:news:archive:${year}:${month}:page:${currentPage}:${normalizedPerPage}`],
        revalidate: NEWS_REVALIDATE_SECONDS,
      },
      endpoint,
    );

    nodes = data.posts.nodes;
    hasNextPage = Boolean(data.posts.pageInfo?.hasNextPage);
    const endCursor = data.posts.pageInfo?.endCursor ?? null;
    if (hasNextPage && endCursor) {
      await setEditorialPageCursor(cacheVersion, cursorScope, currentPage + 1, endCursor);
    }

    if (currentPage === normalizedPage || !hasNextPage || !endCursor) {
      break;
    }
    after = endCursor;
    currentPage += 1;
  } while (true);

  return {
    articles: nodes.map((node) => mapWpPostToArticle(node)),
    pagination: {
      page: normalizedPage,
      perPage: normalizedPerPage,
      hasNextPage,
    },
  };
}

async function getAllTaxonomyNodes(
  fieldName: "categories" | "tags",
  endpoint: string,
  first = 200,
): Promise<WpTaxonomyNode[]> {
  const query = `
    query TaxonomyItems($first: Int!, $after: String) {
      ${fieldName}(first: $first, after: $after) {
        nodes {
          slug
          name
          count
          uri
          link
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const nodes: WpTaxonomyNode[] = [];
  let after: string | null = null;

  do {
    const data: { categories?: WpTaxonomyConnection; tags?: WpTaxonomyConnection } = await wpGraphqlRequest(
      query,
      { first: Math.min(100, first - nodes.length), after },
      {
        tags: ["wp", "news", "wp:news", `wp:news:${fieldName}`],
        revalidate: NEWS_REVALIDATE_SECONDS,
      },
      endpoint,
    );

    const connection = data[fieldName];
    nodes.push(...(connection?.nodes ?? []));
    after = connection?.pageInfo?.hasNextPage ? (connection.pageInfo.endCursor ?? null) : null;
  } while (after && nodes.length < first);

  return nodes.slice(0, first);
}

export async function listArticles(): Promise<NewsArticle[]> {
  if (useMocks) {
    await Promise.all(
      mockArticles.map((article) => registerNewsCategory(article.category, article.categoryLabel ?? article.category)),
    );
    return mockArticles;
  }

  try {
    return await getWpArticles();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown publishing service error";
    throw new Error(`Le flux editorial est indisponible pour le moment: ${message}`);
  }
}

type SitemapEditorialArticle = Pick<NewsArticle, "authorSlug" | "flashSourceSlug" | "modifiedAt" | "publishedAt" | "slug" | "source">;

const WP_SITEMAP_FIELDS = `
  slug
  date
  modified
  author {
    node {
      slug
    }
  }
`;

const WP_NEWS_SITEMAP_FIELDS = `
  ${WP_SITEMAP_FIELDS}
  flashSourceArticle {
    slug
  }
`;

function mapWpPostToSitemapArticle(node: WpPostNode, source: NewsArticle["source"]): SitemapEditorialArticle {
  return {
    source,
    slug: node.slug,
    publishedAt: node.date,
    modifiedAt: node.modified,
    authorSlug: decodeNewsText(node.author?.node?.slug ?? ""),
    flashSourceSlug: source === "news" && node.flashSourceArticle?.slug
      ? decodeNewsText(node.flashSourceArticle.slug)
      : undefined,
  };
}

/** Full editorial inventory reserved for sitemap generation. This deliberately
 * requests only URL metadata so a sitemap refresh never loads card content. */
async function getAllEditorialSitemapArticles(
  field: "posts" | "newsItems",
  source: NewsArticle["source"],
): Promise<SitemapEditorialArticle[]> {
  const endpoint = await getEditorialGraphqlEndpoint();
  const fields = field === "posts" ? WP_SITEMAP_FIELDS : WP_NEWS_SITEMAP_FIELDS;
  const query = `
    query Sitemap${field === "posts" ? "Posts" : "News"}($first: Int!, $after: String) {
      ${field}(first: $first, after: $after) {
        nodes {
          ${fields}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;
  const nodes: WpPostNode[] = [];
  let after: string | null = null;

  do {
    const data: Record<typeof field, WpPostConnection> = await wpGraphqlRequest<Record<typeof field, WpPostConnection>>(
      query,
      { first: 100, after },
      { tags: ["wp", "news", "wp:news", "wp:news:sitemap"], revalidate: 3600 },
      endpoint,
    );
    const connection: WpPostConnection | undefined = data[field];
    nodes.push(...(connection?.nodes ?? []));
    after = connection?.pageInfo?.hasNextPage ? (connection.pageInfo.endCursor ?? null) : null;
  } while (after);

  return nodes.map((node) => mapWpPostToSitemapArticle(node, source));
}

export async function listSitemapEditorialArticles(): Promise<SitemapEditorialArticle[]> {
  if (useMocks) {
    return (await listArticles()).map((article) => ({
      source: article.source,
      slug: article.slug,
      publishedAt: article.publishedAt,
      modifiedAt: article.modifiedAt,
      authorSlug: article.authorSlug,
      flashSourceSlug: article.flashSourceSlug,
    }));
  }

  return getEditorialSnapshot("sitemap", async () => {
    const posts = await getAllEditorialSitemapArticles("posts", "post");
    let news: SitemapEditorialArticle[] = [];
    try {
      news = await getAllEditorialSitemapArticles("newsItems", "news");
    } catch (error) {
      if (!isMissingNewsPostTypeError(error)) {
        throw error;
      }
    }

    return Array.from(
      new Map(
        [...posts, ...news.filter((article) => !article.flashSourceSlug)]
          .map((article) => [getEditorialArticlePath(article), article]),
      ).values(),
    );
  }, EDITORIAL_SITEMAP_SNAPSHOT_TTL_SECONDS);
}

/** Bande principale de l'accueil. */
const HOME_FEATURED_CATEGORY_SLUG = "une";
/** Fil info continu de la colonne de droite. */
const HOME_NEWSFEED_CATEGORY_SLUG = "actualite";

const HOME_FEATURED_COUNT = 4;
const HOME_SECONDARY_COUNT = 6;
const HOME_NEWSFEED_COUNT = 8;

function sortByPublishedAtDesc(articles: NewsArticle[]): NewsArticle[] {
  return articles.slice().sort((left, right) => {
    const leftTime = new Date(left.publishedAt).getTime();
    const rightTime = new Date(right.publishedAt).getTime();
    return rightTime - leftTime;
  });
}

/**
 * Repartition par date, utilisee quand les categories editoriales attendues
 * sont absentes de la source. Conserve le comportement anterieur plutot que de
 * renvoyer une page d'accueil vide.
 */
async function getEditorialHomeByRecency(): Promise<EditorialHome> {
  const articles = sortByPublishedAtDesc(useMocks ? await listArticles() : await getWpHomeArticles());
  const latestDate = articles[0] ? new Date(articles[0].publishedAt) : null;
  const latestDayKey = latestDate ? latestDate.toISOString().slice(0, 10) : null;
  const topStories = latestDayKey
    ? articles.filter((article) => article.publishedAt.slice(0, 10) === latestDayKey).slice(0, HOME_FEATURED_COUNT)
    : articles.slice(0, HOME_FEATURED_COUNT);
  const topStoryIds = new Set(topStories.map((article) => article.id));
  const remaining = articles.filter((article) => !topStoryIds.has(article.id));

  return {
    topStories: topStories.length > 0 ? topStories : articles.slice(0, HOME_FEATURED_COUNT),
    latest: remaining.slice(0, HOME_SECONDARY_COUNT),
    newsfeed: remaining.slice(0, HOME_NEWSFEED_COUNT),
  };
}

async function loadEditorialHome(): Promise<EditorialHome> {
  const [featuredPage, newsfeedPage, recentEditorialArticles] = await Promise.all([
    useMocks
      ? listByCategoryPage(HOME_FEATURED_CATEGORY_SLUG, 1, HOME_FEATURED_COUNT)
      : getWpHomeFeaturedArticles(HOME_FEATURED_COUNT),
    listNewsFeedPage(1, HOME_NEWSFEED_COUNT),
    useMocks ? listArticles() : getWpHomeArticles(),
  ]);

  const featured = sortByPublishedAtDesc(Array.isArray(featuredPage) ? featuredPage : featuredPage.articles);
  const newsfeed = sortByPublishedAtDesc(newsfeedPage.articles);

  if (featured.length === 0 && newsfeed.length === 0) {
    return getEditorialHomeByRecency();
  }

  const topStories = featured.slice(0, HOME_FEATURED_COUNT);
  const topStoryIds = new Set(topStories.map((article) => article.id));
  // Les cartes laterales de l'accueil restent editoriales. Le CPT `news`
  // alimente uniquement le fil d'info et ne remplace pas ces rubriques.
  const secondary = sortByPublishedAtDesc(recentEditorialArticles)
    .filter((article) => !topStoryIds.has(article.id) && article.category !== HOME_FEATURED_CATEGORY_SLUG)
    .slice(0, HOME_SECONDARY_COUNT);

  return {
    topStories: topStories.length > 0 ? topStories : newsfeed.slice(0, HOME_FEATURED_COUNT),
    latest: secondary,
    newsfeed,
  };
}

export async function getEditorialHome(): Promise<EditorialHome> {
  return getEditorialSnapshot("home", loadEditorialHome);
}

export async function getEditorialLandingData(includeEditorialSections = true): Promise<EditorialLandingData> {
  return getEditorialSnapshot(`landing:${includeEditorialSections ? "full" : "category"}`, async () => {
    const [articles, taxonomy, newsFeed, featured] = await Promise.all([
      listArticles(),
      getNewsFooterTaxonomy(),
      listNewsFeedPage(1, 10),
      listByCategoryPage("une", 1, 6),
    ]);

    return {
      articles,
      taxonomy,
      newsFeed,
      featured,
      editorialSections: includeEditorialSections
        ? await getEditorialCategorySections(taxonomy.categories)
        : [],
    };
  });
}

export async function getPostArticleBySlug(slug: string): Promise<NewsArticle | null> {
  if (useMocks) {
    const articles = await listArticles();
    return articles.find((article) => article.slug === slug) ?? null;
  }

  const endpoint = await getEditorialGraphqlEndpoint();
  const query = `
    query ArticleBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        ${WP_ARTICLE_DETAIL_FIELDS_WITH_PLAN}
      }
    }
  `;

  const fallbackQuery = `
    query ArticleBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        ${WP_ARTICLE_DETAIL_FIELDS_WITHOUT_PLAN}
      }
    }
  `;

  const data = await requestWithMinimumPlanFallback<{ post: WpPostNode | null }>(query, fallbackQuery, { slug }, {
    tags: ["wp", "news", "wp:news", `wp:news:${slug}`],
    revalidate: ARTICLE_DETAIL_ACCESS_REVALIDATE_SECONDS,
  }, endpoint);

  if (data.post) {
    const article = mapWpPostToArticle(data.post);
    await registerNewsCategory(article.category, article.categoryLabel);
    return article;
  }

  return null;
}

export async function getNewsArticleBySlug(slug: string, includeFlashSource = true): Promise<NewsArticle | null> {
  if (useMocks) {
    return null;
  }

  if (includeFlashSource && (await cacheStore.get<boolean>(FLASH_SOURCE_CAPABILITY_KEY)) === false) {
    return getNewsArticleBySlug(slug, false);
  }

  const endpoint = await getEditorialGraphqlEndpoint();
  const newsQuery = `
    query NewsItemBySlug($slug: ID!) {
      newsItem(id: $slug, idType: SLUG) {
        ${getWpNewsDetailFields(includeFlashSource)}
      }
    }
  `;

  try {
    const newsData = await wpGraphqlRequest<{ newsItem: WpPostNode | null }>(newsQuery, { slug }, {
      tags: ["wp", "news", "wp:news", "wp:news:ticker", `wp:news:${slug}`],
      revalidate: NEWS_REVALIDATE_SECONDS,
    }, endpoint);

    if (includeFlashSource) {
      await cacheStore.set(FLASH_SOURCE_CAPABILITY_KEY, true, GRAPHQL_CAPABILITY_TTL_SECONDS);
    }

    return newsData.newsItem ? mapWpPostToArticle(newsData.newsItem, "news") : null;
  } catch (error) {
    if (includeFlashSource && isMissingFlashSourceFieldsError(error)) {
      await cacheStore.set(FLASH_SOURCE_CAPABILITY_KEY, false, GRAPHQL_CAPABILITY_TTL_SECONDS);
      return getNewsArticleBySlug(slug, false);
    }

    if (error instanceof Error && error.message.includes('Cannot query field "newsItem"')) {
      return null;
    }

    throw error;
  }
}

/**
 * Compatibility lookup for API routes which still receive only a slug. Public
 * pages use the explicit post/news functions above to avoid ambiguous URLs.
 */
export async function getArticleBySlug(slug: string): Promise<NewsArticle | null> {
  return (await getPostArticleBySlug(slug)) ?? getNewsArticleBySlug(slug);
}

export async function listRelatedArticles(article: NewsArticle, limit = 4): Promise<NewsArticle[]> {
  if (article.source === "news") {
    const feed = await listNewsFeedPage(1, limit + 1);
    return feed.articles.filter((candidate) => candidate.slug !== article.slug).slice(0, limit);
  }

  if (useMocks) {
    const relatedFromMocks = (await listArticles())
      .filter((candidate) => candidate.slug !== article.slug && candidate.category === article.category)
      .slice(0, limit);

    if (relatedFromMocks.length > 0) {
      return relatedFromMocks;
    }

    return (await listArticles())
      .filter((candidate) => candidate.slug !== article.slug)
      .slice(0, limit);
  }

  const endpoint = await getEditorialGraphqlEndpoint();
  const query = `
    query RelatedPosts($categorySlug: String!, $first: Int!) {
      posts(first: $first, where: { categoryName: $categorySlug }) {
        nodes {
          ${WP_ARTICLE_SUMMARY_FIELDS}
        }
      }
    }
  `;

  const fallbackQuery = `
    query RelatedPosts($categorySlug: String!, $first: Int!) {
      posts(first: $first, where: { categoryName: $categorySlug }) {
        nodes {
          ${WP_ARTICLE_SUMMARY_FIELDS}
        }
      }
    }
  `;

  const data = await requestWithMinimumPlanFallback<{ posts: { nodes: WpPostNode[] } }>(
    query,
    fallbackQuery,
    { categorySlug: article.category, first: limit + 1 },
    {
      tags: ["wp", "news", "wp:news", `wp:news:category:${article.category}`],
      revalidate: NEWS_REVALIDATE_SECONDS,
    },
    endpoint,
  );

  const related = data.posts.nodes
    .map((node) => mapWpPostToArticle(node))
    .filter((candidate) => candidate.slug !== article.slug)
    .slice(0, limit);

  if (related.length > 0) {
    return related;
  }

  return (await listArticles())
    .filter((candidate) => candidate.slug !== article.slug)
    .slice(0, limit);
}

export async function listByCategory(categorySlug: string): Promise<NewsArticle[]> {
  if (!useMocks) {
    try {
      // Les archives publiques utilisent la pagination. Cette API historique
      // conserve une fenetre bornee au lieu de charger toute la categorie.
      return (await getWpPostsPageByWhere(
        "PostsByCategoryWindow",
        "categoryName",
        categorySlug,
        `wp:news:category:${categorySlug}`,
        1,
        100,
      )).articles;
    } catch (error) {
      if (isRecoverableEditorialSourceError(error)) {
        return [];
      }

      throw error;
    }
  }

  const articles = await listArticles();
  return articles.filter((article) => article.category === categorySlug);
}

export async function listByCategoryPage(
  categorySlug: string,
  page = 1,
  perPage = 12,
): Promise<NewsCollectionPageResult> {
  if (!useMocks) {
    try {
      if (categorySlug.includes("/")) {
        return await getWpPostsPageByCategoryUri(categorySlug, page, perPage);
      }

      return await getWpPostsPageByWhere(
        "PostsByCategoryPage",
        "categoryName",
        categorySlug,
        `wp:news:category:${categorySlug}`,
        page,
        perPage,
      );
    } catch (error) {
      if (isRecoverableEditorialSourceError(error)) {
        return {
          articles: [],
          pagination: {
            page,
            perPage,
            hasNextPage: false,
          },
        };
      }

      throw error;
    }
  }

  const articles = (await listArticles()).filter((article) => article.category === categorySlug);
  const normalizedPage = Math.max(page, 1);
  const normalizedPerPage = Math.max(perPage, 1);
  const startIndex = (normalizedPage - 1) * normalizedPerPage;

  return {
    articles: articles.slice(startIndex, startIndex + normalizedPerPage),
    pagination: {
      page: normalizedPage,
      perPage: normalizedPerPage,
      hasNextPage: startIndex + normalizedPerPage < articles.length,
    },
  };
}

export async function listByTag(tagSlug: string): Promise<NewsArticle[]> {
  if (!useMocks) {
    try {
      return (await getWpPostsPageByWhere(
        "PostsByTagWindow",
        "tag",
        tagSlug,
        `wp:news:tag:${tagSlug}`,
        1,
        100,
      )).articles;
    } catch (error) {
      if (isRecoverableEditorialSourceError(error)) {
        return [];
      }

      throw error;
    }
  }

  const articles = await listArticles();
  return articles.filter((article) => (article.tagSlugs ?? []).includes(tagSlug));
}

export async function listByTagPage(
  tagSlug: string,
  page = 1,
  perPage = 12,
): Promise<NewsCollectionPageResult> {
  const normalizedPage = Math.max(page, 1);
  const normalizedPerPage = Math.max(perPage, 1);

  if (!useMocks) {
    try {
      return await getWpPostsPageByWhere(
        "PostsByTagPage",
        "tag",
        tagSlug,
        `wp:news:tag:${tagSlug}`,
        normalizedPage,
        normalizedPerPage,
      );
    } catch (error) {
      if (isRecoverableEditorialSourceError(error)) {
        return {
          articles: [],
          pagination: {
            page: normalizedPage,
            perPage: normalizedPerPage,
            hasNextPage: false,
          },
        };
      }

      throw error;
    }
  }

  const articles = (await listArticles()).filter((article) => (article.tagSlugs ?? []).includes(tagSlug));
  const startIndex = (normalizedPage - 1) * normalizedPerPage;

  return {
    articles: articles.slice(startIndex, startIndex + normalizedPerPage),
    pagination: {
      page: normalizedPage,
      perPage: normalizedPerPage,
      hasNextPage: startIndex + normalizedPerPage < articles.length,
    },
  };
}

export async function listByAuthor(authorSlug: string): Promise<NewsArticle[]> {
  if (useMocks) {
    const articles = await listArticles();
    return articles.filter((article) => article.authorSlug === authorSlug);
  }

  try {
    return await getAllWpPostsByWhere(
      "PostsByAuthor",
      "authorName",
      authorSlug,
      `wp:news:author:${authorSlug}`,
    );
  } catch (error) {
    if (isRecoverableEditorialSourceError(error)) {
      return [];
    }

    throw error;
  }
}

export async function listByArchive(year: string, month: string): Promise<NewsArticle[]> {
  if (!useMocks) {
    try {
      // Cette API non paginee reste bornee pour ne pas reintroduire un scan de
      // la source editoriale. Les pages publiques utilisent listByArchivePage.
      return (await getWpArchivePage(year, month, 1, 100)).articles;
    } catch (error) {
      if (isRecoverableEditorialSourceError(error)) {
        return [];
      }

      throw error;
    }
  }

  const articles = await listArticles();
  return articles.filter((article) => {
    const date = new Date(article.publishedAt);
    return String(date.getUTCFullYear()) === year && String(date.getUTCMonth() + 1).padStart(2, "0") === month;
  });
}

export async function listByArchivePage(
  year: string,
  month: string,
  page = 1,
  perPage = 12,
): Promise<NewsCollectionPageResult> {
  if (!useMocks) {
    try {
      return await getWpArchivePage(year, month, page, perPage);
    } catch (error) {
      if (isRecoverableEditorialSourceError(error)) {
        return {
          articles: [],
          pagination: {
            page,
            perPage,
            hasNextPage: false,
          },
        };
      }

      throw error;
    }
  }

  const articles = (await listArticles()).filter((article) => {
    const date = new Date(article.publishedAt);
    return String(date.getUTCFullYear()) === year && String(date.getUTCMonth() + 1).padStart(2, "0") === month;
  });
  const normalizedPage = Math.max(page, 1);
  const normalizedPerPage = Math.max(perPage, 1);
  const startIndex = (normalizedPage - 1) * normalizedPerPage;

  return {
    articles: articles.slice(startIndex, startIndex + normalizedPerPage),
    pagination: {
      page: normalizedPage,
      perPage: normalizedPerPage,
      hasNextPage: startIndex + normalizedPerPage < articles.length,
    },
  };
}

export async function getNewsFooterTaxonomy(): Promise<NewsFooterTaxonomy> {
  const cacheVersion = await getEditorialCursorCacheVersion();
  const cacheKey = `news:footer-taxonomy:v${cacheVersion}`;
  const cached = await cacheStore.get<NewsFooterTaxonomy>(cacheKey);
  if (cached) {
    return cached;
  }

  const endpoint = await getEditorialGraphqlEndpoint();
  const categories = new Map<string, NewsFooterTaxonomyItem>();
  const tags = new Map<string, NewsFooterTaxonomyItem>();
  const genericKeys = new Set(["general", "actualite", "actualites", "a la une", "une"]);
  const [wpCategories, wpTags] = await Promise.all([
    getAllTaxonomyNodes("categories", endpoint, 120),
    getAllTaxonomyNodes("tags", endpoint, 160),
  ]);

  for (const rawCategory of wpCategories) {
    const categorySlug = decodeNewsText(rawCategory.slug ?? "").trim();
    const categoryLabel = decodeNewsText(rawCategory.name ?? "").trim();
    const categoryKey = normalizeNewsText(categoryLabel || categorySlug);
    const count = Number(rawCategory.count ?? 0);

    if (!categorySlug || !categoryLabel || !count || genericKeys.has(categoryKey)) {
      continue;
    }

    categories.set(categorySlug, {
      slug: categorySlug,
      label: categoryLabel,
      count,
      uri: decodeNewsText(rawCategory.uri ?? rawCategory.link ?? `/category/${categorySlug}/`).trim() || `/category/${categorySlug}/`,
    });
  }

  for (const rawTag of wpTags) {
    const tagLabel = decodeNewsText(rawTag.name ?? rawTag.slug ?? "").trim();
    const tagSlug = decodeNewsText(rawTag.slug ?? "").trim();
    const tagKey = normalizeNewsText(tagLabel || tagSlug);
    const count = Number(rawTag.count ?? 0);

    if (!tagLabel || !count || genericKeys.has(tagKey)) {
      continue;
    }

    const matchingCategory = Array.from(categories.values()).find(
      (item) => normalizeNewsText(item.label) === tagKey || normalizeNewsText(item.slug) === tagKey,
    );

    tags.set(tagKey, {
      slug: matchingCategory?.slug ?? tagSlug,
      label: tagLabel,
      count,
      uri: decodeNewsText(rawTag.uri ?? rawTag.link ?? `/tag/${tagSlug}/`).trim() || `/tag/${tagSlug}/`,
    });
  }

  const sortItems = (items: Iterable<NewsFooterTaxonomyItem>) =>
    Array.from(items).sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label, "fr");
    });

  const taxonomy = {
    categories: sortItems(categories.values()),
    tags: sortItems(tags.values()).slice(0, 16),
  };

  await cacheStore.set(cacheKey, taxonomy, EDITORIAL_CURSOR_CACHE_TTL_SECONDS);
  return taxonomy;
}

const EDITORIAL_CATEGORY_SECTIONS: Array<{ key: string; title: string; aliases: string[] }> = [
  { key: "politique", title: "Politique", aliases: ["politique"] },
  { key: "sport", title: "Sport", aliases: ["sport", "sports"] },
  { key: "afrique", title: "Afrique", aliases: ["afrique"] },
  { key: "partenaires", title: "Partenaires", aliases: ["partenaires", "partenaire"] },
  { key: "international", title: "International", aliases: ["international", "internationale"] },
  { key: "culture-divertissement", title: "Culture et divertissement", aliases: ["culture", "divertissement", "culture et divertissement"] },
  { key: "recommandations", title: "Recommandations", aliases: ["recommandations", "recommendations", "reportages", "reportage"] },
];

function findEditorialCategorySlug(categories: NewsFooterTaxonomyItem[], aliases: string[]) {
  const normalizedAliases = new Set(aliases.map(normalizeNewsText));
  const match = categories.find((category) => {
    const label = normalizeNewsText(category.label);
    const slug = normalizeNewsText(category.slug);
    return normalizedAliases.has(label) || normalizedAliases.has(slug);
  });

  return match?.slug ?? null;
}

/** Chargement ordonné des rubriques visibles sur la page Actualités. */
export async function getEditorialCategorySections(
  categories: NewsFooterTaxonomyItem[],
  perSection = 6,
): Promise<NewsEditorialSection[]> {
  const results = await Promise.all(
    EDITORIAL_CATEGORY_SECTIONS.map(async (section) => {
      const categorySlug = findEditorialCategorySlug(categories, section.aliases);
      if (!categorySlug) {
        return { key: section.key, title: section.title, articles: [] };
      }

      const result = await listByCategoryPage(categorySlug, 1, perSection);
      return {
        key: section.key,
        title: section.title,
        articles: sortByPublishedAtDesc(result.articles),
      };
    }),
  );

  return results.filter((section) => section.articles.length > 0);
}
