import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { NextResponse } from "next/server";
import { getNewsFooterTaxonomy, NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getNewsFooterTaxonomy();

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": `public, s-maxage=${NEWS_REVALIDATE_SECONDS}, stale-while-revalidate=${NEWS_REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    const message = getUserFacingErrorMessage(error, "Unable to load news footer taxonomy.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
