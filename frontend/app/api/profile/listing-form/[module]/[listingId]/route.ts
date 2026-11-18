import { NextResponse } from "next/server";
import { getWordPressUserWorkspaceItem } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";

const MODULE_KIND = {
  classifieds: "classified",
  jobs: "job",
  tenders: "tender",
} as const;

export async function GET(_request: Request, { params }: { params: { module: string; listingId: string } }) {
  const session = getServerSession();
  const kind = MODULE_KIND[params.module as keyof typeof MODULE_KIND];
  const listingId = Number.parseInt(params.listingId, 10);

  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Utilisateur non connecté." }, { status: 401 });
  }

  if (!kind || !Number.isFinite(listingId) || listingId <= 0) {
    return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  }

  try {
    const result = await getWordPressUserWorkspaceItem(kind, { wpUserId: session.wpUserId, listingId });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Impossible de charger cette publication." }, { status: 502 });
  }
}
