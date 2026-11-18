import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { NextResponse } from "next/server";

import { getTopVisitedNewsCategories } from "@/features/news/data/category-analytics";
import { NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";

export async function GET() {
  try {
    const categories = await getTopVisitedNewsCategories(6);

    return NextResponse.json({ categories }, {
      headers: {
        "Cache-Control": `public, s-maxage=${NEWS_REVALIDATE_SECONDS}, stale-while-revalidate=${NEWS_REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    const message = getUserFacingErrorMessage(error, "Unable to load trending categories.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

