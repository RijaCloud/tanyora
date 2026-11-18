import { NextResponse } from "next/server";
import { invalidatePublicWordPressCache, relayMvolaCallbackToWordPress } from "@/lib/api/wordpress-internal";

function getExpectedToken() {
  return (process.env.MVOLA_CALLBACK_SECRET || "").trim();
}

async function handleMvolaCallback(request: Request) {
  const url = new URL(request.url);
  const expectedToken = getExpectedToken();
  const receivedToken = (url.searchParams.get("token") || "").trim();

  if (expectedToken && receivedToken !== expectedToken) {
    return NextResponse.json({ error: "Callback MVola non autorise." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Payload MVola invalide." }, { status: 400 });
  }

  try {
    const result = await relayMvolaCallbackToWordPress(payload);
    const kind = typeof result.kind === "string" ? result.kind : "";
    if (kind === "classified" || kind === "job" || kind === "tender") {
      await invalidatePublicWordPressCache(kind);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de traiter le callback MVola." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return handleMvolaCallback(request);
}

export async function PUT(request: Request) {
  return handleMvolaCallback(request);
}
