import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import type { KeyValueStore } from "@/lib/cache/store";
import type { FeatureKey, SubscriptionPlanId } from "@/types/subscriptions";

type ConsumeQuotaInput = {
  store: KeyValueStore;
  userId: string;
  plan: SubscriptionPlanId;
  feature: FeatureKey;
  period: string;
};

function getTtlUntilPeriodEnd(period: string): number {
  const [year, month] = period.split("-").map(Number);
  const periodEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const diffMs = periodEnd.getTime() - Date.now();
  return Math.max(3600, Math.floor(diffMs / 1000));
}

function quotaKey(userId: string, feature: FeatureKey, period: string): string {
  return `quota:${period}:${userId}:${feature}`;
}

export async function consumeFeatureQuota(input: ConsumeQuotaInput): Promise<boolean> {
  const planConfig = SUBSCRIPTION_PLANS[input.plan];
  const limit = planConfig.entitlements[input.feature];

  if (limit === undefined || limit === "unlimited" || typeof limit !== "number") {
    return true;
  }

  const key = quotaKey(input.userId, input.feature, input.period);
  const current = Number((await input.store.get<number>(key)) ?? 0);
  if (current >= limit) {
    return false;
  }

  const ttl = getTtlUntilPeriodEnd(input.period);
  await input.store.increment(key, ttl);
  return true;
}
