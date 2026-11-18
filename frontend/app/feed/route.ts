import { SITE_NAME, SITE_SLOGAN, SITE_URL, toPlainText } from "@/app/metadata";
import { listArticles, NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";

export const revalidate = NEWS_REVALIDATE_SECONDS;

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character] ?? character);
}

function cdata(value: string) {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function absoluteUrl(pathOrUrl: string) {
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : new URL(pathOrUrl, `${SITE_URL}/`).toString();
}

export async function GET() {
  const articles = await listArticles().catch(() => []);
  const items = articles.slice(0, 30).map((article) => {
    const url = absoluteUrl(getEditorialArticlePath(article));
    const description = toPlainText(article.excerpt || article.content, 1_000);
    const image = article.imageUrl ? absoluteUrl(article.imageUrl) : null;

    return [
      "<item>",
      `<title>${cdata(article.title)}</title>`,
      `<link>${escapeXml(url)}</link>`,
      `<guid isPermaLink=\"true\">${escapeXml(url)}</guid>`,
      `<pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>`,
      `<description>${cdata(description)}</description>`,
      article.categoryLabel ? `<category>${cdata(article.categoryLabel)}</category>` : "",
      image ? `<media:content url=\"${escapeXml(image)}\" medium=\"image\" />` : "",
      "</item>",
    ].filter(Boolean).join("");
  }).join("");

  const updatedAt = articles[0]?.modifiedAt || articles[0]?.publishedAt || new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(SITE_SLOGAN)}</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date(updatedAt).toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": `public, s-maxage=${NEWS_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}
