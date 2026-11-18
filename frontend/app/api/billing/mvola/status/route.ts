import { NextResponse } from "next/server";
import { getMvolaStatusFromWordPress, invalidatePublicWordPressCache } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    orderId?: number;
    listingId?: number;
  } | null;

  const orderId = Number(body?.orderId || 0);
  const listingId = Number(body?.listingId || 0);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "orderId requis." }, { status: 400 });
  }

  try {
    const status = await getMvolaStatusFromWordPress({
      wpUserId: session.wpUserId,
      orderId,
      listingId: Number.isFinite(listingId) && listingId > 0 ? listingId : undefined,
    });

    const kind = typeof status.kind === "string" ? status.kind : "";
    if (
      (status.status === "completed" || status.status === "failed") &&
      (kind === "classified" || kind === "job" || kind === "tender")
    ) {
      await invalidatePublicWordPressCache(kind);
    }

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de verifier le paiement MVola." },
      { status: 500 },
    );
  }
}
