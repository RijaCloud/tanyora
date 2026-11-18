import {
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_MODULE_LABELS,
  SUBSCRIPTION_PLANS,
} from "@/config/subscription-plans";
import type {
  EntitlementValue,
  FeatureKey,
  SubscriptionModuleKey,
  SubscriptionPlanId,
} from "@/types/subscriptions";

export function getPlanEntitlement(planId: SubscriptionPlanId, feature: FeatureKey): EntitlementValue {
  return SUBSCRIPTION_PLANS[planId].entitlements[feature];
}

export function hasFeatureAccess(planId: SubscriptionPlanId, feature: FeatureKey): boolean {
  const value = getPlanEntitlement(planId, feature);
  return value !== false && value !== 0;
}

export function formatEntitlementValue(value: EntitlementValue): string {
  if (value === true) return "Illimité";
  if (value === false) return "Non inclus";
  if (value === "unlimited") return "Illimité";
  if (value === "lt_1_year") return "Moins d'un an";
  return `${value}`;
}

export function getModuleEntitlements(planId: SubscriptionPlanId, module: SubscriptionModuleKey) {
  return SUBSCRIPTION_FEATURES.filter((feature) => feature.module === module).map((feature) => ({
    ...feature,
    value: getPlanEntitlement(planId, feature.key),
    valueLabel: formatEntitlementValue(getPlanEntitlement(planId, feature.key)),
    enabled: hasFeatureAccess(planId, feature.key),
  }));
}

export function getProfileEntitlementSections(planId: SubscriptionPlanId) {
  return (Object.keys(SUBSCRIPTION_MODULE_LABELS) as SubscriptionModuleKey[]).map((module) => ({
    module,
    title: SUBSCRIPTION_MODULE_LABELS[module],
    items: getModuleEntitlements(planId, module),
  }));
}
