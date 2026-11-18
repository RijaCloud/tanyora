import { NextResponse } from "next/server";
import { getWordPressUserProfile } from "@/lib/api/wordpress-internal";
import { resolvePreferredProfilePhoto } from "@/lib/auth/profile-photo";
import { setSessionCookie } from "@/lib/auth/session";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";

type AuthenticatedWordPressUser = {
  wpUserId: number;
  email: string;
  displayName: string;
  username?: string;
  role?: string;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
};

export async function buildAuthenticatedLoginResponse(user: AuthenticatedWordPressUser) {
  const [subscription, profile] = await Promise.all([
    subscriptionProvider.getCurrentSubscription(String(user.wpUserId)),
    getWordPressUserProfile({ wpUserId: user.wpUserId }).catch(() => null),
  ]);
  const resolvedPicture = resolvePreferredProfilePhoto(
    profile?.profilePhoto,
    null,
    "local",
    profile?.avatarUrl,
  );
  const normalizedUser = {
    wpUserId: user.wpUserId,
    email: user.email,
    displayName: user.displayName,
    username: user.username,
    role: user.role,
    emailVerified: user.emailVerified !== false,
    onboardingCompleted: user.onboardingCompleted === true,
    planId: subscription.planId,
    subscriptionStatus: subscription.status,
    accessGrant: subscription.accessGrant ?? null,
  };

  const response = NextResponse.json({
    user: {
      wpUserId: normalizedUser.wpUserId,
      email: normalizedUser.email,
      name: normalizedUser.displayName,
      username: normalizedUser.username,
      role: normalizedUser.role,
      emailVerified: normalizedUser.emailVerified,
      picture: resolvedPicture,
      authProvider: "local" as const,
      onboardingCompleted: normalizedUser.onboardingCompleted,
      onboardingIntent: normalizedUser.onboardingCompleted ? undefined : ("complete-profile" as const),
      planId: normalizedUser.planId,
      subscriptionStatus: normalizedUser.subscriptionStatus,
      accessGrant: normalizedUser.accessGrant,
      businessActivityCategory: profile?.businessActivityCategory || undefined,
      firstName: profile?.firstName || undefined,
      lastName: profile?.lastName || undefined,
    },
  });
  setSessionCookie(response, {
    wpUserId: normalizedUser.wpUserId,
    email: normalizedUser.email,
    name: normalizedUser.displayName,
    username: normalizedUser.username,
    role: normalizedUser.role,
    emailVerified: normalizedUser.emailVerified,
    picture: resolvedPicture,
    authProvider: "local",
    onboardingCompleted: normalizedUser.onboardingCompleted,
    onboardingIntent: normalizedUser.onboardingCompleted ? undefined : "complete-profile",
    planId: normalizedUser.planId,
    subscriptionStatus: normalizedUser.subscriptionStatus,
    accessGrant: normalizedUser.accessGrant,
    businessActivityCategory: profile?.businessActivityCategory || undefined,
    firstName: profile?.firstName || undefined,
    lastName: profile?.lastName || undefined,
  });

  return response;
}
