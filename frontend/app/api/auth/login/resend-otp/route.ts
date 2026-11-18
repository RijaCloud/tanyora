import { NextRequest, NextResponse } from "next/server";
import { resendWordPressLoginOtp } from "@/lib/api/wordpress-internal";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const challengeId = typeof body.challengeId === "string" ? body.challengeId.trim() : "";

  if (!challengeId) {
    return NextResponse.json({ error: "Session de connexion introuvable." }, { status: 400 });
  }

  try {
    const result = await resendWordPressLoginOtp({ challengeId });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de renvoyer le code.";
    const lower = message.toLowerCase();
    let status = 502;

    if (lower.includes("status: 400") || lower.includes("expire")) {
      status = 400;
    } else if (lower.includes("status: 429") || lower.includes("attendre")) {
      status = 429;
    }

    return NextResponse.json({ error: message || "Impossible de renvoyer le code." }, { status });
  }
}
