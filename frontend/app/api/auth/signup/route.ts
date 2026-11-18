import { NextRequest, NextResponse } from "next/server";
import { registerWordPressUser } from "@/lib/api/wordpress-internal";
import { setSessionCookie } from "@/lib/auth/session";

function buildUsernameFromEmail(email: string) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9]+$/, "");

  const safeBase = base.length >= 3 ? base : "user2424";
  return `${safeBase}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe obligatoires." }, { status: 400 });
  }

  try {
    const result = await registerWordPressUser({
      username: buildUsernameFromEmail(email),
      firstName: "Nouveau",
      lastName: "Compte",
      email,
      password,
      phone: "",
      birthDate: "",
      address: "",
      profilePhoto: "",
      socialLinks: {},
    });

    const response = NextResponse.json({
      user: {
        wpUserId: result.user.wpUserId,
        email: result.user.email,
        name: result.user.displayName,
        username: result.user.username,
        role: result.user.role,
        emailVerified: result.user.emailVerified !== false,
        picture: null,
        authProvider: "local" as const,
        onboardingCompleted: false,
        onboardingIntent: "signup" as const,
      },
    });

    setSessionCookie(response, {
      wpUserId: result.user.wpUserId,
      email: result.user.email,
      name: result.user.displayName,
      username: result.user.username,
      role: result.user.role,
      emailVerified: result.user.emailVerified !== false,
      picture: null,
      authProvider: "local",
      onboardingCompleted: false,
      onboardingIntent: "signup",
      planId: "free",
      subscriptionStatus: "none",
    });

    return response;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const lower = rawMessage.toLowerCase();
    console.error("[auth/signup] unexpected error", error);

    if (lower.includes("platform_auth_email_exists") || lower.includes("cet email existe deja")) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé. Essayez de vous connecter." },
        { status: 409 },
      );
    }

    if (lower.includes("platform_auth_weak_password") || lower.includes("mot de passe")) {
      return NextResponse.json(
        { error: "Le mot de passe ne respecte pas les critères de sécurité." },
        { status: 400 },
      );
    }

    if (lower.includes("platform_auth_invalid_payload") || lower.includes("champs obligatoires")) {
      return NextResponse.json(
        { error: "Certaines informations sont manquantes ou invalides." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Inscription temporairement indisponible. Veuillez réessayer dans un instant." },
      { status: 502 },
    );
  }
}
