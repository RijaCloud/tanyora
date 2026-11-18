import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";
import Root from "@/features/prototype/pages/Root";
import { getServerSession } from "@/lib/auth/session";
import { DEFAULT_SOCIAL_IMAGE, SITE_NAME, SITE_SLOGAN, SITE_URL, assertSeoEnvironment } from "@/app/metadata";
import { getWordPressPublicSiteConfig } from "@/lib/api/wordpress-internal";
import { getPublicSiteMetadata } from "@/lib/seo/public-page-metadata";

const JSON_LD_OPEN_ANGLE_ESCAPE = `${String.fromCharCode(92)}u003c`;
const DEFAULT_SOCIAL_LINKS: string[] = [];

const BUILD_MARKER = (
  process.env.NEXT_PUBLIC_BUILD_ID ||
  process.env.GITHUB_SHA ||
  process.env.AWS_COMMIT_ID ||
  process.env.AWS_JOB_ID ||
  "dev"
).slice(0, 8);

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPublicSiteMetadata();

  return {
    ...metadata,
    manifest: "/favicon/site.webmanifest?v=tanyora1",
    icons: {
      icon: [{ url: "/favicon/favicon.svg?v=tanyora1", type: "image/svg+xml" }],
      apple: [{ url: "/favicon/favicon.svg?v=tanyora1", type: "image/svg+xml" }],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  assertSeoEnvironment();
  const session = getServerSession();
  const config = await getWordPressPublicSiteConfig().catch(() => null);
  const siteName = SITE_NAME;
  const siteDescription = SITE_SLOGAN;
  const siteLogoUrl = undefined;
  const siteImage = DEFAULT_SOCIAL_IMAGE;
  const configuredSocialLinks = Object.values(config?.footer?.socialLinks || {})
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url && /^https?:\/\//i.test(url) && !/2424[.\-_]|24\/24|UCcjS1Us2l3yB8lLsDu3Vr6w/i.test(url)));
  const socialLinks = configuredSocialLinks.length > 0 ? configuredSocialLinks : DEFAULT_SOCIAL_LINKS;

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title={`${SITE_NAME} - Flux`} href={`${SITE_URL}/feed/`} />
        <script
          dangerouslySetInnerHTML={{
            __html: "try { if (localStorage.getItem('prototype-theme') === 'dark') document.documentElement.classList.add('dark'); } catch (_) {}",
          }}
        />
      </head>
      <body className="prototype-app" data-build={BUILD_MARKER}>
        <Providers initialUser={session}>
          <Root siteLogoUrl={siteLogoUrl}>{children}</Root>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed bottom-2 left-2 z-[9999] select-none rounded-full bg-black/[0.03] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.22em] text-black/[0.18] dark:bg-white/[0.04] dark:text-white/[0.18]"
            title={`Build ${BUILD_MARKER}`}
          >
            {BUILD_MARKER}
          </div>
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: SITE_URL,
                  name: siteName,
                  description: siteDescription,
                  publisher: { "@id": `${SITE_URL}/#organization` },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${SITE_URL}/?s={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                  inLanguage: "fr-FR",
                },
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: siteName,
                  url: SITE_URL,
                  logo: {
                    "@type": "ImageObject",
                    url: siteImage.startsWith("http") ? siteImage : `${SITE_URL}${siteImage}`,
                  },
                  sameAs: socialLinks,
                },
              ],
            }).replace(/</g, JSON_LD_OPEN_ANGLE_ESCAPE),
          }}
        />
      </body>
    </html>
  );
}
