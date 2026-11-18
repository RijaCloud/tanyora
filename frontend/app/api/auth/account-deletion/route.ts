import { NextRequest, NextResponse } from "next/server";
import { deleteWordPressAccount } from "@/lib/api/wordpress-internal";
import { clearSessionCookie, getServerSession } from "@/lib/auth/session";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Utilisateur non connecté." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const confirmation = typeof body?.confirmation === "string" ? body.confirmation.trim() : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const challengeId = typeof body?.challengeId === "string" ? body.challengeId : "";
  const verificationCode = typeof body?.verificationCode === "string" ? body.verificationCode : "";

  if (confirmation !== "SUPPRIMER") {
    return NextResponse.json({ error: 'Saisissez « SUPPRIMER » pour confirmer.' }, { status: 400 });
  }
  if (session.authProvider === "google" && (!challengeId || !verificationCode)) {
    return NextResponse.json({ error: "Saisissez le code reçu par email pour confirmer." }, { status: 400 });
  }
  if (session.authProvider !== "google" && !currentPassword) {
    return NextResponse.json({ error: "Saisissez votre mot de passe actuel pour confirmer." }, { status: 400 });
  }

  const rateLimit = await consumeRateLimit({
    scope: "auth-account-deletion",
    subject: `${session.wpUserId}:${getClientIp(request)}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez un peu plus tard." }, { status: 429 });
  }

  try {
    await deleteWordPressAccount({
      wpUserId: session.wpUserId,
      confirmation,
      currentPassword: session.authProvider === "google" ? undefined : currentPassword,
      challengeId: session.authProvider === "google" ? challengeId : undefined,
      verificationCode: session.authProvider === "google" ? verificationCode : undefined,
    });
    const response = NextResponse.json({ ok: true, message: "Votre compte a été supprimé." });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("[auth/account-deletion] failed", { wpUserId: session.wpUserId, error });
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Impossible de supprimer votre compte pour le moment.") },
      { status: 400 },
    );
  }
}
