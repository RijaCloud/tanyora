import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { NextResponse } from "next/server";

import { getEditorialHome, NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";

export async function GET() {
  try {
    const editorialHome = await getEditorialHome();

    return NextResponse.json(editorialHome, {
      headers: {
        "Cache-Control": `public, s-maxage=${NEWS_REVALIDATE_SECONDS}, stale-while-revalidate=${NEWS_REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    const message = getUserFacingErrorMessage(error, "Unable to load home editorial content.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

