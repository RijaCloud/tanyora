import type { Metadata } from "next";
import {
  buildMetadata,
  DEFAULT_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
  SITE_SLOGAN,
  SITE_TITLE,
  SITE_URL,
  isNonProductionSite,
  normalizeSeoTitle,
  toPlainText,
} from "@/app/metadata";
import { getWordPressPublicSiteConfig, type WordPressPublicSiteConfigResult } from "@/lib/api/wordpress-internal";

export type PublicSeoPageKey = "home" | "news" | "classifieds" | "jobs" | "tenders" | "directory" | "pricing";

function getPublicSeo(config: WordPressPublicSiteConfigResult) {
  return config.seo;
}

function cleanSeoText(value?: string | null, maxLength = 10_000) {
  const text = toPlainText(value, maxLength);
  return /2424\.mg|united malagasy media/i.test(text) ? "" : text;
}

export async function getPublicPageMetadata(
  key: PublicSeoPageKey,
  path: string,
  fallbackTitle?: string,
  fallbackDescription?: string,
): Promise<Metadata> {
  const resolvedFallbackTitle = normalizeSeoTitle(fallbackTitle) || SITE_TITLE;
  const resolvedFallbackDescription = fallbackDescription || DEFAULT_DESCRIPTION;

  try {
    const config = await getWordPressPublicSiteConfig();
    const seo = getPublicSeo(config);
    const page = seo?.pages?.[key];

    return buildMetadata(normalizeSeoTitle(cleanSeoText(page?.title)) || resolvedFallbackTitle, cleanSeoText(page?.description) || resolvedFallbackDescription, {
      path,
      image: page?.imageUrl || DEFAULT_SOCIAL_IMAGE,
      noIndex: page?.noIndex,
      siteName: cleanSeoText(seo?.siteName) || SITE_TITLE,
    });
  } catch {
    return buildMetadata(resolvedFallbackTitle, resolvedFallbackDescription, { path });
  }
}

export async function getPublicSiteMetadata(): Promise<Metadata> {
  try {
    const config = await getWordPressPublicSiteConfig();
    const seo = getPublicSeo(config);
    const siteName = cleanSeoText(seo?.siteName) || SITE_NAME;
    const siteTitle = normalizeSeoTitle(cleanSeoText(seo?.pages?.home?.title)) || SITE_TITLE;
    const description = cleanSeoText(seo?.pages?.home?.description) || cleanSeoText(seo?.siteTagline) || DEFAULT_DESCRIPTION;
    const image = DEFAULT_SOCIAL_IMAGE;

    return {
      metadataBase: new URL(SITE_URL),
      title: {
        default: siteTitle,
        template: `%s | ${siteName}`,
      },
      applicationName: siteName,
      description,
      robots: {
        index: !isNonProductionSite(),
        follow: !isNonProductionSite(),
        googleBot: {
          index: !isNonProductionSite(),
          follow: !isNonProductionSite(),
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      },
      openGraph: {
        type: "website",
        locale: "fr_FR",
        url: "/",
        siteName,
        title: siteTitle,
        description,
        images: [{ url: image, width: 512, height: 512, alt: siteName }],
      },
      twitter: {
        card: "summary_large_image",
        title: siteTitle,
        description,
        images: [image],
      },
      icons: seo?.siteIconUrl
        ? {
            icon: [{ url: seo.siteIconUrl }],
            apple: [{ url: seo.siteIconUrl }],
          }
        : undefined,
    };
  } catch {
    return {
      metadataBase: new URL(SITE_URL),
      title: { default: SITE_TITLE, template: "%s | Tanyora" },
      applicationName: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      robots: {
        index: !isNonProductionSite(),
        follow: !isNonProductionSite(),
      },
      openGraph: {
        type: "website",
        locale: "fr_FR",
        url: "/",
        siteName: SITE_TITLE,
        title: SITE_TITLE,
        description: DEFAULT_DESCRIPTION,
        images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 512, height: 512, alt: SITE_NAME }],
      },
      twitter: {
        card: "summary_large_image",
        title: SITE_TITLE,
        description: DEFAULT_DESCRIPTION,
        images: [DEFAULT_SOCIAL_IMAGE],
      },
    };
  }
}

export function getPublicSiteJsonLdDescription() {
  return SITE_SLOGAN;
}
