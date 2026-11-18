import type { Metadata } from "next";

export const SITE_NAME = "Tanyora";
export const SITE_TITLE = "Tanyora - Minéraux et experts miniers à Madagascar";
export const SITE_SLOGAN = "La rencontre entre acheteurs, vendeurs et experts miniers à Madagascar";
export const DEFAULT_DESCRIPTION =
  "Découvrez des annonces de minéraux, contactez des vendeurs et trouvez des experts du secteur minier à Madagascar.";
export const DEFAULT_SOCIAL_IMAGE = "/new-logo.svg";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "https://tanyora.mijary.tech";
const configuredDeploymentEnvironment = (process.env.DEPLOYMENT_ENV || "development").trim().toLowerCase();
const PRODUCTION_ORIGIN = "https://tanyora.mijary.tech";

export const SITE_URL = configuredSiteUrl.replace(/\/+$/, "");

export function isPublicProductionSite() {
  return configuredDeploymentEnvironment === "production" && SITE_URL === PRODUCTION_ORIGIN;
}

export function isNonProductionSite() {
  // A deployment is never indexable by accident: production must be declared
  // explicitly and use the sole public canonical origin.
  return !isPublicProductionSite();
}

export function assertSeoEnvironment() {
  if (configuredDeploymentEnvironment === "production" && SITE_URL !== PRODUCTION_ORIGIN) {
    throw new Error(`Production SEO requires ${PRODUCTION_ORIGIN}; received ${SITE_URL || "an empty origin"}.`);
  }
}

export function normalizeSeoTitle(value?: string | null) {
  return (value || "")
    .replace(/^[\s|\-–—:]+/, "")
    .replace(/[\s|\-–—:]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

type MetadataOptions = {
  path?: string;
  image?: string;
  siteName?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
};

function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return new URL(value.startsWith("/") ? value : `/${value}`, `${SITE_URL}/`).toString();
}

function canonicalUrl(path?: string) {
  if (!path || path === "/") {
    return SITE_URL;
  }

  return absoluteUrl(path);
}

export function buildMetadata(title?: string, description?: string, options: MetadataOptions = {}): Metadata {
  const resolvedTitle = normalizeSeoTitle(title);
  const resolvedDescription = description?.trim() || DEFAULT_DESCRIPTION;
  const resolvedSiteName = options.siteName?.trim() || SITE_TITLE;
  const url = canonicalUrl(options.path);
  const image = absoluteUrl(options.image || DEFAULT_SOCIAL_IMAGE);
  const noIndex = options.noIndex === true || isNonProductionSite();
  const isArticle = options.type === "article";

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: options.path ? { canonical: url } : undefined,
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: isArticle ? "article" : "website",
      locale: "fr_FR",
      ...(options.path ? { url } : {}),
      siteName: resolvedSiteName,
      title: resolvedTitle || SITE_TITLE,
      description: resolvedDescription,
      images: [{ url: image, width: 512, height: 512, alt: SITE_NAME }],
      ...(isArticle
        ? {
            publishedTime: options.publishedTime,
            modifiedTime: options.modifiedTime,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle || SITE_TITLE,
      description: resolvedDescription,
      images: [image],
    },
  };
}

export function toPlainText(value?: string | null, maxLength = 160) {
  const decoded = (value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#0*34;/gi, '"')
    .replace(/&#0*39;|&apos;|&#x27;/gi, "'")
    .replace(/&rsquo;|&lsquo;/gi, "'")
    .replace(/&rdquo;|&ldquo;/gi, '"')
    .replace(/&hellip;/gi, "...")
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)))
    .replace(/\s+/g, " ")
    .trim();

  if (decoded.length <= maxLength) {
    return decoded;
  }

  return `${decoded.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function humanizeSlug(value: string) {
  return decodeURIComponent(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
