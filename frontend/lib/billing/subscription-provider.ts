import { DEFAULT_SUBSCRIPTION_PLAN_ID } from "@/config/subscription-plans";
import { getWooCommerceBillingHistory, getWooCommerceSubscriptionSnapshot } from "@/lib/api/wordpress-internal";
import type { BillingHistoryItem, SubscriptionPlanId, UserSubscriptionSnapshot } from "@/types/subscriptions";

export type SubscriptionProvider = {
  getCurrentSubscription(userId: string): Promise<UserSubscriptionSnapshot>;
  getCheckoutUrl(planId: SubscriptionPlanId): Promise<string | null>;
  getBillingHistory(userId: string): Promise<BillingHistoryItem[]>;
};

class LocalSubscriptionProvider implements SubscriptionProvider {
  async getCurrentSubscription(): Promise<UserSubscriptionSnapshot> {
    return {
      planId: DEFAULT_SUBSCRIPTION_PLAN_ID,
      status: "none",
      billingProvider: "local",
      renewsAt: null,
      startedAt: null,
      wcSubscriptionId: null,
      wcCustomerId: null,
    };
  }

  async getCheckoutUrl(): Promise<string | null> {
    return null;
  }

  async getBillingHistory(): Promise<BillingHistoryItem[]> {
    return [];
  }
}

export class WooCommerceSubscriptionsProvider implements SubscriptionProvider {
  async getCurrentSubscription(userId: string): Promise<UserSubscriptionSnapshot> {
    const wpUserId = Number.parseInt(userId, 10);
    if (!Number.isFinite(wpUserId) || wpUserId <= 0) {
      return {
        planId: DEFAULT_SUBSCRIPTION_PLAN_ID,
        status: "none",
        billingProvider: "woocommerce-subscriptions",
        renewsAt: null,
        startedAt: null,
        wcSubscriptionId: null,
        wcCustomerId: null,
      };
    }

    return getWooCommerceSubscriptionSnapshot({ wpUserId });
  }

  async getCheckoutUrl(): Promise<string | null> {
    return null;
  }

  async getBillingHistory(userId: string): Promise<BillingHistoryItem[]> {
    const wpUserId = Number.parseInt(userId, 10);
    if (!Number.isFinite(wpUserId) || wpUserId <= 0) {
      return [];
    }

    return getWooCommerceBillingHistory({ wpUserId });
  }
}

export const subscriptionProvider: SubscriptionProvider =
  process.env.SUBSCRIPTION_PROVIDER === "woocommerce"
    ? new WooCommerceSubscriptionsProvider()
    : new LocalSubscriptionProvider();
