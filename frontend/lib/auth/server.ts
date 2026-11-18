import { redirect } from "next/navigation";
import { buildOnboardingUrl, isOnboardingRequired, sanitizeReturnTo } from "@/lib/auth/flow";
import type { AppSessionUser } from "@/lib/auth/session";

export function requireAuthenticatedUser(
  user: AppSessionUser | null,
  options?: {
    returnTo?: string;
    allowIncompleteOnboarding?: boolean;
  },
) {
  const returnTo = sanitizeReturnTo(options?.returnTo);

  if (!user) {
    redirect("/login");
  }

  if (!options?.allowIncompleteOnboarding && isOnboardingRequired(user)) {
    redirect(buildOnboardingUrl(returnTo, user.authProvider === "google" ? "google" : "email"));
  }

  return user;
}
