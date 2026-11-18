import { NextRequest, NextResponse } from "next/server";
import { getWordPressUserProfile, syncWordPressUser, updateWordPressUserProfilePhoto } from "@/lib/api/wordpress-internal";
import { buildOnboardingUrl, hasCompletedOnboardingState } from "@/lib/auth/flow";
import {
  clearGoogleOauthCookie,
  exchangeGoogleCode,
  fetchGoogleUserProfile,
  getDefaultGoogleReturnTo,
  getPublicRequestOrigin,
  readGoogleOauthCookie,
} from "@/lib/auth/google";
import { isLikelyGeneratedGravatar, resolvePreferredProfilePhoto } from "@/lib/auth/profile-photo";
import { setSessionCookie } from "@/lib/auth/session";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";
import { DEFAULT_SUBSCRIPTION_PLAN_ID } from "@/config/subscription-plans";

export async function GET(request: NextRequest) {
  const nextUrl = request.nextUrl;
  const error = nextUrl.searchParams.get("error");
  const code = nextUrl.searchParams.get("code");
  const state = nextUrl.searchParams.get("state");
  const oauthState = readGoogleOauthCookie();
  const publicOrigin = getPublicRequestOrigin(request);
  const redirectBaseOrigin = oauthState?.appOrigin || publicOrigin;

  const fail = (message: string) => {
    const response = NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, redirectBaseOrigin),
    );
    clearGoogleOauthCookie(response);
    return response;
  };

  if (error) {
    return fail("La connexion Google a été interrompue.");
  }

  if (!code || !state || !oauthState || oauthState.state !== state) {
    return fail("La session Google a expiré. Merci de recommencer.");
  }

  try {
    const accessToken = await exchangeGoogleCode(
      code,
      request.nextUrl.origin,
      oauthState.appOrigin || publicOrigin,
    );
    const profile = await fetchGoogleUserProfile(accessToken);
    const syncedUser = await syncWordPressUser({
      auth0Sub: `google-oauth2|${profile.sub}`,
      email: profile.email,
      name: profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim() || profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
    });

    let onboardingCompleted = hasCompletedOnboardingState(syncedUser);
    let resolvedFirstName = profile.given_name;
    let resolvedLastName = profile.family_name;
    let resolvedPicture = profile.picture || null;
    let resolvedBusinessActivityCategory: string | undefined;

    try {
      const existingProfile = await getWordPressUserProfile({ wpUserId: syncedUser.wpUserId });
      onboardingCompleted = hasCompletedOnboardingState(existingProfile);
      resolvedFirstName = existingProfile.firstName || resolvedFirstName;
      resolvedLastName = existingProfile.lastName || resolvedLastName;
      resolvedPicture = resolvePreferredProfilePhoto(
        existingProfile.profilePhoto,
        resolvedPicture,
        "google",
        existingProfile.avatarUrl,
      );
      resolvedBusinessActivityCategory = existingProfile.businessActivityCategory || undefined;

      if (profile.picture && (!existingProfile.profilePhoto || isLikelyGeneratedGravatar(existingProfile.profilePhoto))) {
        try {
          const updatedProfile = await updateWordPressUserProfilePhoto({
            wpUserId: syncedUser.wpUserId,
            profilePhoto: profile.picture,
          });
          resolvedPicture = updatedProfile.profilePhoto || profile.picture;
        } catch (profilePhotoSyncError) {
          console.warn("[auth/google/callback] profile photo sync failed", profilePhotoSyncError);
        }
      }
    } catch (profileError) {
      console.warn("[auth/google/callback] profile hydration failed during onboarding check", profileError);
    }

    const subscription =
      onboardingCompleted
        ? await subscriptionProvider.getCurrentSubscription(String(syncedUser.wpUserId))
        : {
            planId: DEFAULT_SUBSCRIPTION_PLAN_ID,
            status: "none" as const,
            accessGrant: null,
          };
    const googleIntent = oauthState.intent === "signup" ? "signup" : "login";
    const returnTo = oauthState.returnTo || getDefaultGoogleReturnTo();
    const destination = onboardingCompleted ? returnTo : buildOnboardingUrl(returnTo, "google");

    const response = NextResponse.redirect(new URL(destination, redirectBaseOrigin));
    clearGoogleOauthCookie(response);
    setSessionCookie(response, {
      wpUserId: syncedUser.wpUserId,
      email: syncedUser.email,
      name: syncedUser.displayName,
      username: syncedUser.platformUsername || syncedUser.username,
      role: syncedUser.role,
      emailVerified: true,
      picture: resolvedPicture,
      authProvider: "google",
      providerSubject: profile.sub,
      onboardingCompleted,
      onboardingIntent: onboardingCompleted ? undefined : (googleIntent === "signup" ? "signup" : "complete-profile"),
      planId: subscription.planId,
      subscriptionStatus: subscription.status,
      accessGrant: subscription.accessGrant ?? null,
      businessActivityCategory: resolvedBusinessActivityCategory,
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
    });

    return response;
  } catch (callbackError) {
    const message =
      callbackError instanceof Error ? callbackError.message : "Connexion Google impossible pour le moment.";
    return fail(message);
  }
}
