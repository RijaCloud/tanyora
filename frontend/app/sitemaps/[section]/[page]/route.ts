import { isNonProductionSite } from "@/app/metadata";
import { getSitemapSectionPage, sitemapXml, type SitemapSection } from "@/lib/seo/sitemap";

export const revalidate = 3600;
// Each segment reads the current public listing index, which is runtime data.
export const dynamic = "force-dynamic";

const SECTIONS = new Set<SitemapSection>(["static", "editorial", "classified", "job", "tender"]);

export async function GET(_request: Request, { params }: { params: { section: string; page: string } }) {
  if (isNonProductionSite() || !SECTIONS.has(params.section as SitemapSection)) {
    return new Response("Not found", { status: 404 });
  }

  const page = Number.parseInt(params.page.replace(/\.xml$/, ""), 10);
  if (!Number.isInteger(page) || page < 1) {
    return new Response("Not found", { status: 404 });
  }
  const entries = await getSitemapSectionPage(params.section as SitemapSection, page);
  if (!entries.length) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(sitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
