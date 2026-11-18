import { NextRequest, NextResponse } from "next/server";

import { listNewsFeedPage, NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { rejectExcessiveEditorialTraffic } from "@/features/news/lib/public-request-guards";

export const dynamic = "force-dynamic";

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 20;
/**
 * Plafond de pagination. Le fil est une entree en matiere, pas un remplacant
 * de /actualites : au-dela, le lecteur bascule sur la page dediee plutot que
 * d'accumuler des centaines d'articles dans l'onglet.
 */
const MAX_PAGE = 10;

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export async function GET(request: NextRequest) {
  const rejected = await rejectExcessiveEditorialTraffic(request);
  if (rejected) return rejected;
  const page = parsePositiveInt(request.nextUrl.searchParams.get("page"), 1, MAX_PAGE);
  const perPage = parsePositiveInt(request.nextUrl.searchParams.get("perPage"), DEFAULT_PER_PAGE, MAX_PER_PAGE);

  try {
    const result = await listNewsFeedPage(page, perPage);

    return NextResponse.json(
      {
        articles: result.articles,
        pagination: {
          ...result.pagination,
          // Le client s'arrete au plafond, meme si la source a encore des pages.
          hasNextPage: result.pagination.hasNextPage && page < MAX_PAGE,
          maxPage: MAX_PAGE,
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${NEWS_REVALIDATE_SECONDS}, stale-while-revalidate=${NEWS_REVALIDATE_SECONDS}`,
        },
      },
    );
  } catch (error) {
    const message = getUserFacingErrorMessage(error, "Impossible de charger le fil d'actualité.");
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
