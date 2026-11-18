import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_SUBSCRIPTION_PLAN_ID } from "@/config/subscription-plans";
import { getWordPressUserProfile } from "@/lib/api/wordpress-internal";
import { hasCompletedOnboardingState } from "@/lib/auth/flow";
import { resolvePreferredProfilePhoto } from "@/lib/auth/profile-photo";
import { getServerSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/session";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";

function authMeLog(message: string, context?: Record<string, unknown>) {
  console.log(`[auth-me] ${message}`, context ?? {});
}

async function getSafeSubscription(wpUserId: number | string | undefined) {
  try {
    return await subscriptionProvider.getCurrentSubscription(String(wpUserId || "0"));
  } catch (error) {
    authMeLog("Subscription lookup failed, falling back to local snapshot.", {
      wpUserId: wpUserId ?? null,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      planId: DEFAULT_SUBSCRIPTION_PLAN_ID,
      status: "none" as const,
      billingProvider: "local" as const,
      renewsAt: null,
      startedAt: null,
      wcSubscriptionId: null,
      wcCustomerId: null,
    };
  }
}

export async function GET(request: NextRequest) {
  const user = getServerSession();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  // The signed session cookie already contains the data needed to render the
  // account UI. Only explicit account or billing changes need WordPress data.
  if (request.nextUrl.searchParams.get("refresh") !== "1") {
    return NextResponse.json({ user }, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  }

  let resolvedEmailVerified = user.emailVerified;
  let profile = null;
  if (user.wpUserId) {
    try {
      profile = await getWordPressUserProfile({ wpUserId: user.wpUserId });
      resolvedEmailVerified = profile.emailVerified !== false;
    } catch {
      resolvedEmailVerified = false;
    }
  }

  const shouldHydrateMissingBusinessActivity =
    user.wpUserId &&
    user.planId === "business" &&
    (!user.businessActivityCategory || user.businessActivityCategory.trim() === "");

  if (user.wpUserId && (!profile || !user.picture || !user.firstName || !user.lastName || shouldHydrateMissingBusinessActivity)) {
    try {
      profile = profile ?? (await getWordPressUserProfile({ wpUserId: user.wpUserId }));
      if (typeof resolvedEmailVerified === "undefined") {
        resolvedEmailVerified = profile.emailVerified !== false;
      }
    } catch {
      // Keep the current session snapshot when the profile endpoint is temporarily unavailable.
    }
  }

  if (user.onboardingCompleted === false) {
    const isSignupIntent = user.onboardingIntent === "signup";
    const recoveredOnboardingCompleted = hasCompletedOnboardingState(profile);

    if (recoveredOnboardingCompleted && !isSignupIntent) {
      const subscription = await getSafeSubscription(user.wpUserId);
      const normalizedPlanId = subscription.status === "none" ? DEFAULT_SUBSCRIPTION_PLAN_ID : subscription.planId;
      const response = NextResponse.json({
        user: {
          ...user,
          emailVerified: resolvedEmailVerified !== false,
          onboardingCompleted: true,
          onboardingIntent: undefined,
          planId: normalizedPlanId,
          subscriptionStatus: subscription.status,
          accessGrant: subscription.accessGrant ?? null,
          businessActivityCategory: profile?.businessActivityCategory || user.businessActivityCategory,
          firstName: profile?.firstName || user.firstName,
          lastName: profile?.lastName || user.lastName,
          picture: resolvePreferredProfilePhoto(
            profile?.profilePhoto,
            user.picture,
            user.authProvider,
            profile?.avatarUrl,
          ),
        },
      });

      setSessionCookie(response, {
        ...user,
        onboardingCompleted: true,
        onboardingIntent: undefined,
        planId: normalizedPlanId,
        subscriptionStatus: subscription.status,
        accessGrant: subscription.accessGrant ?? null,
        businessActivityCategory: profile?.businessActivityCategory || user.businessActivityCategory,
        emailVerified: resolvedEmailVerified !== false,
        firstName: profile?.firstName || user.firstName,
        lastName: profile?.lastName || user.lastName,
        picture: resolvePreferredProfilePhoto(
          profile?.profilePhoto,
          user.picture,
          user.authProvider,
          profile?.avatarUrl,
        ),
      });

      return response;
    }

    const response = NextResponse.json({
      user: {
        ...user,
        emailVerified: resolvedEmailVerified !== false,
        onboardingIntent: user.onboardingIntent ?? "complete-profile",
        planId: DEFAULT_SUBSCRIPTION_PLAN_ID,
        subscriptionStatus: "none" as const,
        businessActivityCategory: profile?.businessActivityCategory || user.businessActivityCategory,
      },
    });

    setSessionCookie(response, {
      ...user,
      planId: DEFAULT_SUBSCRIPTION_PLAN_ID,
      subscriptionStatus: "none",
      onboardingCompleted: false,
      onboardingIntent: user.onboardingIntent ?? "complete-profile",
      emailVerified: resolvedEmailVerified !== false,
      businessActivityCategory: profile?.businessActivityCategory || user.businessActivityCategory,
    });

    return response;
  }

  const subscription = await getSafeSubscription(user.wpUserId);
  const normalizedPlanId = subscription.status === "none" ? DEFAULT_SUBSCRIPTION_PLAN_ID : subscription.planId;
  authMeLog("Resolved subscription snapshot for session.", {
    wpUserId: user.wpUserId,
    email: user.email,
    onboardingCompleted: user.onboardingCompleted ?? null,
    sessionPlanId: user.planId ?? null,
    sessionStatus: user.subscriptionStatus ?? null,
    providerPlanId: subscription.planId,
    providerStatus: subscription.status,
    normalizedPlanId,
    wcSubscriptionId: subscription.wcSubscriptionId ?? null,
    wcCustomerId: subscription.wcCustomerId ?? null,
  });
  const response = NextResponse.json({
    user: {
      ...user,
      emailVerified: resolvedEmailVerified !== false,
      onboardingIntent: undefined,
      planId: normalizedPlanId,
      subscriptionStatus: subscription.status,
      accessGrant: subscription.accessGrant ?? null,
      businessActivityCategory: profile?.businessActivityCategory || user.businessActivityCategory,
      name: profile?.displayName || user.name,
      firstName: profile?.firstName || user.firstName,
      lastName: profile?.lastName || user.lastName,
      picture: resolvePreferredProfilePhoto(
        profile?.profilePhoto,
        user.picture,
        user.authProvider,
        profile?.avatarUrl,
      ),
    },
  });

  setSessionCookie(response, {
    ...user,
    planId: normalizedPlanId,
    subscriptionStatus: subscription.status,
    accessGrant: subscription.accessGrant ?? null,
    onboardingCompleted: user.onboardingCompleted ?? true,
    onboardingIntent: undefined,
    emailVerified: resolvedEmailVerified !== false,
    businessActivityCategory: profile?.businessActivityCategory || user.businessActivityCategory,
    name: profile?.displayName || user.name,
    firstName: profile?.firstName || user.firstName,
    lastName: profile?.lastName || user.lastName,
    picture: resolvePreferredProfilePhoto(
      profile?.profilePhoto,
      user.picture,
      user.authProvider,
      profile?.avatarUrl,
    ),
  });

  return response;
}
