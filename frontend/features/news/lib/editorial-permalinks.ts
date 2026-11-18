import type { NewsArticle } from "@/features/news/types";

/**
 * Keeps editorial URLs aligned with the legacy public structure:
 * WordPress posts live at the site root while the `news` CPT lives below /news.
 */
export function getEditorialArticlePath(article: Pick<NewsArticle, "slug" | "source" | "flashSourceSlug">) {
  const slug = encodeURIComponent(article.flashSourceSlug || article.slug);
  return article.source === "news" && !article.flashSourceSlug ? `/news/${slug}` : `/${slug}`;
}

export function normalizeEditorialUriToPath(uri?: string | null) {
  if (!uri) {
    return "/";
  }

  try {
    const parsed = uri.startsWith("http://") || uri.startsWith("https://")
      ? new URL(uri)
      : new URL(uri, "https://2424.local");
    const pathname = parsed.pathname || "/";
    if (pathname === "/") {
      return "/";
    }

    return pathname.replace(/\/+$/, "") || "/";
  } catch {
    const normalized = uri.startsWith("/") ? uri : `/${uri}`;
    return normalized.replace(/\/+$/, "") || "/";
  }
}

export function extractTerminalSlug(segments: string[] | string | undefined) {
  if (!segments) {
    return "";
  }

  if (Array.isArray(segments)) {
    return segments[segments.length - 1] ?? "";
  }

  return segments;
}

/**
 * WP_Query accepte les slugs hierarchiques pour les categories. Les conserver
 * evite de confondre une sous-categorie avec une categorie racine homonyme.
 */
export function extractHierarchicalSlug(segments: string[] | string | undefined) {
  const source = Array.isArray(segments) ? segments : [segments];

  return source
    .flatMap((segment) => String(segment ?? "").split("/"))
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");
}
