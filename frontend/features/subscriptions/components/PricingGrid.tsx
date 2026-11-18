"use client";

import { useState } from "react";
import type { BillingPeriod, SubscriptionPlanId } from "@/types/subscriptions";
import type { PricingPlan } from "@/features/subscriptions/plan-catalog";
import { PricingCard } from "@/features/subscriptions/components/PricingCard";

type PricingGridProps = {
  plans: PricingPlan[];
  onSelect: (planId: SubscriptionPlanId, billingPeriod: BillingPeriod) => void | Promise<void>;
  isDataLoading?: boolean;
  isDataUnavailable?: boolean;
};

export function PricingGrid({ plans, onSelect, isDataLoading = false, isDataUnavailable = false }: PricingGridProps) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const gridClassName =
    plans.length === 2
      ? "mx-auto grid max-w-[920px] grid-cols-1 gap-6 md:grid-cols-2"
      : "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3";

  function handleSelect(planId: SubscriptionPlanId, billingPeriod: BillingPeriod) {
    const key = `${planId}:${billingPeriod}`;
    setPendingKey(key);

    Promise.resolve(onSelect(planId, billingPeriod))
      .catch(() => undefined)
      .finally(() => {
        setPendingKey(null);
      });
  }

  return (
    <div className={`${gridClassName} ${isDataUnavailable ? "[&_.animate-pulse]:animate-none" : ""}`} aria-busy={isDataLoading}>
      {plans.map((plan) => (
        <PricingCard
          key={`${plan.id}:${plan.billingPeriod}`}
          plan={plan}
          onSelect={handleSelect}
          isLoading={pendingKey === `${plan.id}:${plan.billingPeriod}`}
          isDataLoading={isDataLoading || isDataUnavailable}
          isDataUnavailable={isDataUnavailable}
        />
      ))}
    </div>
  );
}
