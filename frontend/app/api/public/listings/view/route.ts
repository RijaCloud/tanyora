import { NextRequest, NextResponse } from "next/server";

import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { incrementWordPressPublicListingView, type PublicListingKind } from "@/lib/api/wordpress-internal";

type TrackableListingKind = Extract<PublicListingKind, "classified" | "job" | "tender">;

function isTrackableListingKind(value: unknown): value is TrackableListingKind {
  return value === "classified" || value === "job" || value === "tender";
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const kind = payload?.kind;
    const id = Number(payload?.id ?? 0);

    if (!isTrackableListingKind(kind) || !Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Paramètres de suivi invalides." }, { status: 400 });
    }

    const result = await incrementWordPressPublicListingView({ kind, id });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Impossible d'enregistrer cette vue.") },
      { status: 502 },
    );
  }
}
