import { NextRequest, NextResponse } from "next/server";

import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { NEWS_REVALIDATE_SECONDS, searchNewsArticles } from "@/features/news/data/news.repository";
import { rejectExcessiveEditorialTraffic } from "@/features/news/lib/public-request-guards";

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value || "5", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 10) : 5;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const rejected = await rejectExcessiveEditorialTraffic(request);
    if (rejected) return rejected;
    const search = (request.nextUrl.searchParams.get("search") || "").trim();
    if (search.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const items = await searchNewsArticles(search, parseLimit(request.nextUrl.searchParams.get("perPage")));
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${NEWS_REVALIDATE_SECONDS}, stale-while-revalidate=${NEWS_REVALIDATE_SECONDS}`,
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Impossible de rechercher les actualités.") },
      { status: 500 },
    );
  }
}
