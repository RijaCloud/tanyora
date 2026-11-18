import type { AppSessionUser } from "@/lib/auth/session";
import type { SubscriptionPlanId } from "@/types/subscriptions";

const SESSION_SYNC_ATTEMPTS = 3;
const SESSION_SYNC_RETRY_DELAY_MS = 800;

function isPaidPlan(planId?: SubscriptionPlanId): planId is Exclude<SubscriptionPlanId, "free"> {
  return planId === "essentiel" || planId === "business";
}

export async function syncPaidSession(
  refreshSession: () => Promise<AppSessionUser | null | undefined>,
  confirmedPlanId?: SubscriptionPlanId,
): Promise<boolean> {
  const expectedPaidPlan = isPaidPlan(confirmedPlanId) ? confirmedPlanId : undefined;

  for (let attempt = 1; attempt <= SESSION_SYNC_ATTEMPTS; attempt += 1) {
    try {
      const user = await refreshSession();
      if (!user) return false;
      if (isPaidPlan(user.planId) && (!expectedPaidPlan || user.planId === expectedPaidPlan)) {
        return true;
      }
    } catch {
      // A temporary refresh failure must not interrupt navigation.
    }

    if (attempt < SESSION_SYNC_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, SESSION_SYNC_RETRY_DELAY_MS));
    }
  }

  return false;
}
