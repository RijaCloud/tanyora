import { isNonProductionSite } from "@/app/metadata";
import { getSitemapSections, sitemapIndexXml, sitemapSectionUrl } from "@/lib/seo/sitemap";

export const revalidate = 3600;
// Listing counts come from WordPress at request time; do not pre-render this route during builds.
export const dynamic = "force-dynamic";

export async function GET() {
  if (isNonProductionSite()) {
    return new Response("Not found", { status: 404 });
  }

  const sections = await getSitemapSections();
  const locations = sections.flatMap(({ section, pages }) => Array.from({ length: pages }, (_, index) => sitemapSectionUrl(section, index + 1)));
  return new Response(sitemapIndexXml(locations), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
