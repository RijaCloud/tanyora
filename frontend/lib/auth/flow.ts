import type { AppSessionUser } from "@/lib/auth/session";

export const DEFAULT_AUTH_RETURN_TO = "/";

const DISALLOWED_AUTH_RETURN_TO_PREFIXES = [
  "/login",
  "/onboarding",
  "/bienvenue",
  "/api/auth",
];

export function sanitizeReturnTo(returnTo?: string | null) {
  if (!returnTo) {
    return DEFAULT_AUTH_RETURN_TO;
  }

  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return DEFAULT_AUTH_RETURN_TO;
  }

  const normalizedReturnTo = returnTo.toLowerCase();
  if (DISALLOWED_AUTH_RETURN_TO_PREFIXES.some((prefix) => normalizedReturnTo.startsWith(prefix))) {
    return DEFAULT_AUTH_RETURN_TO;
  }

  return returnTo;
}

export function isOnboardingRequired(user: AppSessionUser | null | undefined) {
  return Boolean(user && user.onboardingCompleted === false);
}

type OnboardingStateLike = {
  onboardingCompleted?: boolean;
  platformUsername?: string;
} & Record<string, unknown>;

export function hasCompletedOnboardingState(profile: OnboardingStateLike | null | undefined) {
  return profile?.onboardingCompleted === true;
}

export function buildOnboardingUrl(returnTo?: string | null, method: "email" | "google" = "google") {
  const params = new URLSearchParams({
    method,
    returnTo: sanitizeReturnTo(returnTo),
  });

  return `/onboarding?${params.toString()}`;
}
