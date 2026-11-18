import { NextRequest, NextResponse } from "next/server";
import { changeWordPressPassword } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { getFirstPasswordRequirementFailure } from "@/lib/auth/password-policy";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Utilisateur non connecte." }, { status: 401 });
  }

  if (session.authProvider === "google") {
    return NextResponse.json({ error: "Le mot de passe de ce compte est géré par Google." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Renseignez votre mot de passe actuel et votre nouveau mot de passe." }, { status: 400 });
  }

  const failedRequirement = getFirstPasswordRequirementFailure(newPassword);
  if (failedRequirement) {
    return NextResponse.json({ error: `Mot de passe invalide : ${failedRequirement.label}.` }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "Le nouveau mot de passe doit être différent de l'ancien." }, { status: 400 });
  }

  const rateLimit = await consumeRateLimit({
    scope: "auth-password-change",
    subject: `${session.wpUserId}:${getClientIp(request)}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives de changement de mot de passe. Merci de réessayer un peu plus tard." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const result = await changeWordPressPassword({
      wpUserId: session.wpUserId,
      currentPassword,
      newPassword,
    });
    return NextResponse.json({ ok: true, message: result.message || "Votre mot de passe a été mis à jour." });
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Impossible de modifier votre mot de passe pour le moment.") },
      { status: 400 },
    );
  }
}
