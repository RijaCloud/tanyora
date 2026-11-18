import { NextRequest, NextResponse } from "next/server";
import { registerWordPressUser, updateWordPressUserProfile } from "@/lib/api/wordpress-internal";
import { getServerSession, setSessionCookie } from "@/lib/auth/session";

function generatePassword() {
  return `G-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}!Aa1`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const session = getServerSession();
  const isGoogleOnboarding = session?.authProvider === "google" && session.onboardingCompleted === false;
  const isLocalOnboarding = session?.authProvider === "local" && session.onboardingCompleted === false && Boolean(session?.wpUserId);
  const resolvedUsername =
    typeof body.username === "string" && body.username.trim().length > 0
      ? body.username.trim()
      : session?.username || undefined;

  if (!body.firstName || !body.lastName || !body.email) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }

  if (!isGoogleOnboarding && !isLocalOnboarding && !body.password) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }

  if (!isGoogleOnboarding && !isLocalOnboarding && !resolvedUsername) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }

  if (isGoogleOnboarding && body.email !== session.email) {
    return NextResponse.json({ error: "L'email Google ne peut pas etre modifie." }, { status: 400 });
  }

  if (isLocalOnboarding && body.email !== session?.email) {
    return NextResponse.json({ error: "L'email du compte ne peut pas etre modifie pendant l'onboarding." }, { status: 400 });
  }

  if ((isGoogleOnboarding || isLocalOnboarding) && session?.wpUserId) {
    const syncedProfile = await updateWordPressUserProfile({
      wpUserId: session.wpUserId,
      username: resolvedUsername,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      birthDate: body.birthDate,
      address: body.address,
      profilePhoto: body.profilePhoto || session.picture || null,
      socialLinks: body.socialLinks,
      businessActivityCategory: body.businessActivityCategory,
    });

    const response = NextResponse.json({
      user: {
        wpUserId: session.wpUserId,
        email: session.email,
        displayName: syncedProfile.displayName,
        username: syncedProfile.username,
        role: session.role,
      },
      emailSent: false,
      emailMessage: "",
    });

    setSessionCookie(response, {
      ...session,
      username: syncedProfile.username || resolvedUsername,
      name: syncedProfile.displayName,
      picture: syncedProfile.profilePhoto || body.profilePhoto || session.picture || null,
      onboardingCompleted: true,
      firstName: syncedProfile.firstName || body.firstName,
      lastName: syncedProfile.lastName || body.lastName,
      businessActivityCategory: syncedProfile.businessActivityCategory || undefined,
      planId: session.planId ?? "free",
      subscriptionStatus: session.subscriptionStatus ?? "none",
    });

    return response;
  }

  try {
    const result = await registerWordPressUser({
      ...body,
      username: resolvedUsername!,
      password: body.password || generatePassword(),
    });

    const response = NextResponse.json({
      user: result.user,
      emailSent: result.emailSent,
      emailMessage: result.emailMessage,
    });

    setSessionCookie(response, {
      wpUserId: result.user.wpUserId,
      email: result.user.email,
      name: result.user.displayName,
      username: result.user.username,
      role: result.user.role,
      emailVerified: result.user.emailVerified !== false,
      picture: body.profilePhoto || session?.picture || null,
      authProvider: isGoogleOnboarding ? "google" : "local",
      providerSubject: session?.providerSubject,
      onboardingCompleted: true,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    return response;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const lower = rawMessage.toLowerCase();
    console.error("[auth/register] unexpected error", error);

    if (lower.includes("platform_auth_username_exists") || lower.includes("nom d'utilisateur existe")) {
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà utilisé." },
        { status: 409 },
      );
    }

    if (lower.includes("platform_auth_email_exists") || lower.includes("cet email existe deja")) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 409 },
      );
    }

    if (lower.includes("platform_auth_invalid_birth_date") || lower.includes("date de naissance")) {
      return NextResponse.json(
        { error: "La date de naissance est invalide." },
        { status: 400 },
      );
    }

    if (lower.includes("platform_auth_weak_password") || lower.includes("mot de passe")) {
      return NextResponse.json(
        { error: "Le mot de passe ne respecte pas les critères de sécurité." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Inscription temporairement indisponible. Veuillez réessayer dans un instant." },
      { status: 502 },
    );
  }
}
