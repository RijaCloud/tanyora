import { NextResponse } from "next/server";

import { searchWordPressTypesense } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";

// The overlay owns scrolling, so search must not silently hide matching items
// behind the old ten-item provider cap.
type SearchGroups = {
  article: Array<Record<string, unknown>>;
  classified: Array<Record<string, unknown>>;
  job: Array<Record<string, unknown>>;
  tender: Array<Record<string, unknown>>;
  directory: Array<Record<string, unknown>>;
};

function emptyGroups(): SearchGroups {
  return { article: [], classified: [], job: [], tender: [], directory: [] };
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();
  if (query.length < 2) {
    return NextResponse.json({ groups: emptyGroups() });
  }

  let groups: SearchGroups;
  try {
    groups = (await searchWordPressTypesense(query)).groups;
  } catch {
    return NextResponse.json({ error: "Recherche indisponible." }, { status: 503 });
  }
  const isBusinessUser = getServerSession()?.planId === "business";

  return NextResponse.json(
    {
      groups: {
        ...groups,
        // Tenders remain private to Business users without fragmenting the
        // cached public source results by session.
        tender: isBusinessUser ? groups.tender : [],
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
