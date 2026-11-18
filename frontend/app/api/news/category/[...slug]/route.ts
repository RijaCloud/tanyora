import { NextRequest, NextResponse } from "next/server";

import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { getServerSession } from "@/lib/auth/session";
import { listByCategoryPage } from "@/features/news/data/news.repository";
import { limitEditorialArchive } from "@/features/news/lib/archive-access";
import { extractHierarchicalSlug } from "@/features/news/lib/editorial-permalinks";
import { rejectExcessiveEditorialTraffic } from "@/features/news/lib/public-request-guards";
import { parseEditorialPage, parseEditorialPerPage } from "@/features/news/lib/public-pagination";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } },
) {
  try {
    const rejected = await rejectExcessiveEditorialTraffic(request);
    if (rejected) return rejected;
    const page = parseEditorialPage(request.nextUrl.searchParams.get("page"));
    const perPage = parseEditorialPerPage(request.nextUrl.searchParams.get("perPage"));
    const slug = extractHierarchicalSlug(params.slug);
    const payload = limitEditorialArchive(await listByCategoryPage(slug, page, perPage), getServerSession()?.planId);

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = getUserFacingErrorMessage(error, "Unable to load category articles.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
