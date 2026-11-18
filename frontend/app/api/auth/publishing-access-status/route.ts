import { NextResponse } from "next/server";
import { getWordPressPublishingAccessStatus } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

export async function GET() {
  const session = getServerSession();

  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const status = await getWordPressPublishingAccessStatus({ wpUserId: session.wpUserId });
    return NextResponse.json({ status }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de charger vos droits de publication." },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}
