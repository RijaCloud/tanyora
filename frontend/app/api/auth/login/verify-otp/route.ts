import { NextRequest, NextResponse } from "next/server";
import { verifyWordPressLoginOtp } from "@/lib/api/wordpress-internal";
import { buildAuthenticatedLoginResponse } from "../shared";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const challengeId = typeof body.challengeId === "string" ? body.challengeId.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!challengeId || !code) {
    return NextResponse.json({ error: "Code de connexion manquant." }, { status: 400 });
  }

  try {
    const result = await verifyWordPressLoginOtp({ challengeId, code });
    return buildAuthenticatedLoginResponse(result.user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification OTP impossible.";
    const lower = message.toLowerCase();
    let status = 502;

    if (lower.includes("status: 400") || lower.includes("expired") || lower.includes("expire")) {
      status = 400;
    } else if (lower.includes("status: 401") || lower.includes("invalide")) {
      status = 401;
    } else if (lower.includes("status: 429") || lower.includes("trop de tentatives")) {
      status = 429;
    }

    return NextResponse.json(
      { error: message || "Impossible de verifier le code de connexion." },
      { status },
    );
  }
}
