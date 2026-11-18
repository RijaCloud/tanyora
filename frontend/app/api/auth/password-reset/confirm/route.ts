import { NextRequest, NextResponse } from "next/server";
import { confirmWordPressPasswordReset } from "@/lib/api/wordpress-internal";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const login = String(body?.login || "").trim();
  const key = String(body?.key || "").trim();
  const password = String(body?.password || "");

  if (!login || !key || !password) {
    return NextResponse.json({ error: "Lien de réinitialisation invalide." }, { status: 400 });
  }

  const rateLimit = await consumeRateLimit({
    scope: "auth-password-reset-confirm",
    subject: `${login}:${getClientIp(request)}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives de réinitialisation. Merci de réessayer un peu plus tard." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const result = await confirmWordPressPasswordReset({ login, key, password });
    return NextResponse.json({
      ok: true,
      message: result.message || "Votre mot de passe a été réinitialisé avec succès.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de réinitialiser le mot de passe pour le moment.",
      },
      { status: 400 },
    );
  }
}
