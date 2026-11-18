import { NextResponse } from "next/server";
import { requestWordPressAccountDeletionCode } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export async function POST() {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Utilisateur non connecté." }, { status: 401 });
  }
  if (session.authProvider !== "google") {
    return NextResponse.json({ error: "Ce code est réservé aux comptes Google." }, { status: 400 });
  }

  const rateLimit = await consumeRateLimit({
    scope: "auth-account-deletion-code",
    subject: String(session.wpUserId),
    limit: 3,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Trop de demandes de code. Réessayez un peu plus tard." }, { status: 429 });
  }

  try {
    const result = await requestWordPressAccountDeletionCode({ wpUserId: session.wpUserId });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[auth/account-deletion/request-code] failed", { wpUserId: session.wpUserId, error });
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Impossible d'envoyer le code pour le moment.") },
      { status: 400 },
    );
  }
}
