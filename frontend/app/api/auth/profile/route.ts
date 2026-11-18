import { NextRequest, NextResponse } from "next/server";
import { getWordPressUserProfile, updateWordPressUserProfile } from "@/lib/api/wordpress-internal";
import { resolvePreferredProfilePhoto } from "@/lib/auth/profile-photo";
import { getServerSession, setSessionCookie } from "@/lib/auth/session";

export async function GET() {
  const session = getServerSession();

  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Utilisateur non connecte." }, { status: 401 });
  }

  try {
    const profile = await getWordPressUserProfile({ wpUserId: session.wpUserId });
    return NextResponse.json({
      profile: {
        ...profile,
        onboardingCompleted:
          session.onboardingIntent === "signup" && session.onboardingCompleted === false
            ? false
            : profile.onboardingCompleted,
      },
    });
  } catch (error) {
    console.error("[auth/profile:get] unexpected error", error);
    return NextResponse.json(
      { error: "Impossible de charger votre profil pour le moment." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = getServerSession();
  const requestId = `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = Date.now();

  if (!session?.wpUserId) {
    console.error(`[auth/profile:update][${requestId}] missing session or wpUserId`, {
      hasSession: Boolean(session),
      wpUserId: session?.wpUserId ?? null,
    });
    return NextResponse.json({ error: "Utilisateur non connecte." }, { status: 401 });
  }

  const body = await request.json();
  const normalizedBusinessRegions = Array.isArray(body.businessRegions)
    ? body.businessRegions
        .filter((value: unknown) => typeof value === "string" && value.trim().length > 0)
        .map((value: string) => value.trim())
        .slice(0, 1)
    : undefined;
  const normalizedBusinessCities = Array.isArray(body.businessCities)
    ? body.businessCities
        .filter((value: unknown) => typeof value === "string" && value.trim().length > 0)
        .map((value: string) => value.trim())
        .slice(0, 1)
    : undefined;
  console.info(`[auth/profile:update][${requestId}] start`, {
    wpUserId: session.wpUserId,
    authProvider: session.authProvider,
    onboardingCompleted: session.onboardingCompleted ?? null,
    hasUsername: typeof body.username === "string" && body.username.trim().length > 0,
    hasFirstName: typeof body.firstName === "string" && body.firstName.trim().length > 0,
    hasLastName: typeof body.lastName === "string" && body.lastName.trim().length > 0,
    hasPhone: typeof body.phone === "string" && body.phone.trim().length > 0,
    hasBirthDate: typeof body.birthDate === "string" && body.birthDate.trim().length > 0,
    hasAddress: typeof body.address === "string" && body.address.trim().length > 0,
    hasBusinessActivityCategory:
      typeof body.businessActivityCategory === "string" && body.businessActivityCategory.trim().length > 0,
    businessRegionsCount: normalizedBusinessRegions?.length ?? 0,
    businessCitiesCount: normalizedBusinessCities?.length ?? 0,
    hasProfilePhoto: typeof body.profilePhoto === "string" && body.profilePhoto.trim().length > 0,
    hasCompanyLogo: typeof body.companyLogo === "string" && body.companyLogo.trim().length > 0,
    notificationEmailsEnabled:
      typeof body.notificationEmailsEnabled === "boolean" ? body.notificationEmailsEnabled : null,
    hasSocialLinks: Boolean(body.socialLinks && typeof body.socialLinks === "object"),
    completeOnboarding: Boolean(body.completeOnboarding),
  });

  try {
    const profile = await updateWordPressUserProfile({
      wpUserId: session.wpUserId,
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      birthDate: body.birthDate,
      address: body.address,
      businessActivityCategory: body.businessActivityCategory,
      businessRegions: normalizedBusinessRegions,
      businessCities: normalizedBusinessCities,
      directoryVisibilityEnabled:
        typeof body.directoryVisibilityEnabled === "boolean" ? body.directoryVisibilityEnabled : undefined,
      profilePhoto: body.profilePhoto,
      companyLogo: body.companyLogo,
      notificationEmailsEnabled:
        typeof body.notificationEmailsEnabled === "boolean" ? body.notificationEmailsEnabled : undefined,
      completeOnboarding: Boolean(body.completeOnboarding),
      socialLinks: body.socialLinks,
    });
    console.info(`[auth/profile:update][${requestId}] wordpress update success`, {
      durationMs: Date.now() - startedAt,
      profileUsername: profile.username ?? null,
      profileDisplayName: profile.displayName ?? null,
      hasProfilePhoto: Boolean(profile.profilePhoto),
      hasCompanyLogo: Boolean(profile.companyLogo),
    });

    const shouldCompleteOnboarding = Boolean(body.completeOnboarding);
    const response = NextResponse.json({ profile });
    setSessionCookie(response, {
      ...session,
      name: profile.displayName,
      username: profile.username || session.username,
      picture: resolvePreferredProfilePhoto(
        profile.profilePhoto,
        session.picture,
        session.authProvider,
        profile.avatarUrl,
      ),
      firstName: profile.firstName || session.firstName,
      lastName: profile.lastName || session.lastName,
      businessActivityCategory: profile.businessActivityCategory || undefined,
      onboardingCompleted: shouldCompleteOnboarding
        ? true
        : session.onboardingCompleted ?? true,
      onboardingIntent: shouldCompleteOnboarding ? undefined : session.onboardingIntent,
    });
    console.info(`[auth/profile:update][${requestId}] session cookie updated`, {
      durationMs: Date.now() - startedAt,
      onboardingCompleted: shouldCompleteOnboarding ? true : session.onboardingCompleted ?? true,
      username: profile.username || session.username || null,
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[auth/profile:update][${requestId}] unexpected error`, {
      durationMs: Date.now() - startedAt,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : null,
      wpUserId: session.wpUserId,
      authProvider: session.authProvider,
      body: {
        username: body.username ?? null,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        phone: body.phone ?? null,
        birthDate: body.birthDate ?? null,
        address: body.address ?? null,
        businessActivityCategory: body.businessActivityCategory ?? null,
        businessRegionsCount: normalizedBusinessRegions?.length ?? 0,
        businessCitiesCount: normalizedBusinessCities?.length ?? 0,
        hasProfilePhoto: Boolean(body.profilePhoto),
        hasCompanyLogo: Boolean(body.companyLogo),
        notificationEmailsEnabled:
          typeof body.notificationEmailsEnabled === "boolean" ? body.notificationEmailsEnabled : null,
        hasSocialLinks: Boolean(body.socialLinks),
        completeOnboarding: Boolean(body.completeOnboarding),
      },
    });
    return NextResponse.json(
      { error: "Mise à jour temporairement indisponible. Veuillez réessayer." },
      { status: 400 },
    );
  }
}
