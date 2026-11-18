import { NextRequest, NextResponse } from "next/server";
import { getWordPressClassifiedFinalizationStatus } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";

type RouteContext = {
  params: {
    id: string;
  };
};

function parseListingId(raw: string) {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = getServerSession();
  if (!session?.email || !session.wpUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingId = parseListingId(context.params.id);
  if (!listingId) {
    return NextResponse.json({ error: "Identifiant annonce invalide." }, { status: 400 });
  }

  const result = await getWordPressClassifiedFinalizationStatus({
    wpUserId: session.wpUserId,
    listingId,
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
