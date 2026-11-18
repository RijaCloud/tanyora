import { subscriptionProvider } from "@/lib/billing/subscription-provider";
import type { AppSessionUser } from "@/lib/auth/session";

const BUSINESS_ACCESS_STATUSES = new Set(["active", "trialing"]);

export function hasBusinessPlanInSession(session: AppSessionUser | null) {
  return (
    session?.planId === "business" &&
    BUSINESS_ACCESS_STATUSES.has(session.subscriptionStatus || "none")
  );
}

export async function hasActiveBusinessAccess(session: AppSessionUser | null) {
  if (!session?.wpUserId) {
    return false;
  }

  try {
    const subscription = await subscriptionProvider.getCurrentSubscription(String(session.wpUserId));
    return subscription.planId === "business" && BUSINESS_ACCESS_STATUSES.has(subscription.status);
  } catch {
    return hasBusinessPlanInSession(session);
  }
}

