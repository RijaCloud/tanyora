import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { sendWordPressEmailVerification } from "@/lib/api/wordpress-internal";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.email || !session.wpUserId) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  if (session.emailVerified !== false) {
    return NextResponse.json({ ok: true, alreadyVerified: true, message: "Votre email est déjà vérifié." });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json(
      { error: "Terminez d'abord votre profil avant de demander un nouvel email de vérification." },
      { status: 409 },
    );
  }

  const rateLimit = await consumeRateLimit({
    scope: "auth-email-verification-resend",
    subject: `${session.wpUserId}:${session.email}:${getClientIp(request)}`,
    limit: 3,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes d'email de vérification. Merci de patienter avant de recommencer." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    await sendWordPressEmailVerification({
      wpUserId: session.wpUserId,
      email: session.email,
    });

    return NextResponse.json({
      ok: true,
      alreadyVerified: false,
      emailSent: true,
      message: "Email de vérification envoyé. Vérifiez votre boîte de réception.",
    });
  } catch (error) {
    const message = getUserFacingErrorMessage(error, "Impossible d'envoyer l'email de vérification.");
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
