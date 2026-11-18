import { NextRequest, NextResponse } from "next/server";

import { listByArchivePage } from "@/features/news/data/news.repository";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { getServerSession } from "@/lib/auth/session";
import { limitEditorialArchive } from "@/features/news/lib/archive-access";
import { rejectExcessiveEditorialTraffic } from "@/features/news/lib/public-request-guards";
import { parseEditorialPage, parseEditorialPerPage } from "@/features/news/lib/public-pagination";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string; month: string } },
) {
  try {
    const rejected = await rejectExcessiveEditorialTraffic(request);
    if (rejected) return rejected;
    const page = parseEditorialPage(request.nextUrl.searchParams.get("page"));
    const perPage = parseEditorialPerPage(request.nextUrl.searchParams.get("perPage"));
    const payload = limitEditorialArchive(
      await listByArchivePage(params.year, params.month, page, perPage),
      getServerSession()?.planId,
    );

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = getUserFacingErrorMessage(error, "Unable to load archive articles.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
