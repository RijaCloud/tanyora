import { NextRequest, NextResponse } from "next/server";
import { loginWordPressUser } from "@/lib/api/wordpress-internal";
import {
  clearLoginLockout,
  getLoginLockout,
  getLoginLockoutPolicy,
  recordFailedLoginAttempt,
} from "@/lib/security/login-lockout";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifier || !password) {
    return NextResponse.json({ error: "Email ou mot de passe manquant." }, { status: 400 });
  }

  const activeLockout = await getLoginLockout(identifier);
  if (activeLockout) {
    return NextResponse.json(
      {
        error: "Trop de tentatives de connexion. Merci de reessayer plus tard ou de reinitialiser votre mot de passe.",
      },
      { status: 429, headers: { "Retry-After": String(activeLockout.retryAfterSeconds) } },
    );
  }

  try {
    const challenge = await loginWordPressUser({
      identifier,
      password,
    });
    await clearLoginLockout(identifier);
    return NextResponse.json(challenge);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const lower = rawMessage.toLowerCase();
    console.error("[auth/login] unexpected error", error);

    if (
      lower.includes("platform_auth_bad_password") ||
      lower.includes("platform_auth_unknown_user") ||
      lower.includes("mot de passe invalide") ||
      lower.includes("compte introuvable")
    ) {
      const failureState = await recordFailedLoginAttempt(identifier);
      if (failureState?.locked) {
        const policy = getLoginLockoutPolicy();
        return NextResponse.json(
          {
            error: `Trop de tentatives de connexion. Votre acces est temporairement bloque pendant ${Math.floor(policy.durationSeconds / 60)} minutes.`,
          },
          { status: 429, headers: { "Retry-After": String(failureState.retryAfterSeconds) } },
        );
      }

      return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Connexion temporairement indisponible. Veuillez reessayer." },
      { status: 502 },
    );
  }
}
