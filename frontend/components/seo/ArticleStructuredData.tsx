import { SITE_URL, toPlainText } from "@/app/metadata";

const JSON_LD_OPEN_ANGLE_ESCAPE = `${String.fromCharCode(92)}u003c`;

type ArticleStructuredDataProps = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  publishedAt: string;
  modifiedAt?: string | null;
  authorName?: string | null;
  category?: string | null;
};

function absoluteUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : new URL(value, `${SITE_URL}/`).toString();
}

/** Server-rendered editorial schema keeps crawlers independent from client hydration. */
export function ArticleStructuredData({ title, description, path, image, publishedAt, modifiedAt, authorName, category }: ArticleStructuredDataProps) {
  const url = absoluteUrl(path);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        description: toPlainText(description),
        isPartOf: { "@id": `${SITE_URL}/#website` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        inLanguage: "fr-FR",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Actualités", item: absoluteUrl("/actualites") },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      },
      {
        "@type": "NewsArticle",
        mainEntityOfPage: { "@id": `${url}#webpage` },
        headline: title,
        description: toPlainText(description),
        datePublished: publishedAt,
        dateModified: modifiedAt || publishedAt,
        ...(image ? { image: [absoluteUrl(image)] } : {}),
        ...(authorName ? { author: { "@type": "Person", name: authorName } } : {}),
        ...(category ? { articleSection: category } : {}),
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "fr-FR",
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, JSON_LD_OPEN_ANGLE_ESCAPE) }} />;
}
