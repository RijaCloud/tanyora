import { NextRequest, NextResponse } from "next/server";
import { requestWordPressPasswordReset } from "@/lib/api/wordpress-internal";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const identifier = String(body?.identifier || "").trim();

  if (!identifier) {
    return NextResponse.json({ error: "Email manquant." }, { status: 400 });
  }

  const rateLimit = await consumeRateLimit({
    scope: "auth-password-reset-request",
    subject: `${identifier}:${getClientIp(request)}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes de réinitialisation. Merci de réessayer un peu plus tard." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const result = await requestWordPressPasswordReset({ identifier });
    return NextResponse.json({
      ok: true,
      message:
        result.message ||
        "Si un compte existe avec cette adresse, un email de réinitialisation vient d'être envoyé.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer l'email de réinitialisation.",
      },
      { status: 400 },
    );
  }
}
