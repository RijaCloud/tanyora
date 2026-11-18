export type SubscriptionPlanId = "free" | "essentiel" | "business";
export type PaymentMethodId = "papi";
export type BillingPeriod = "monthly" | "annual";

export type SubscriptionModuleKey = "news" | "jobs" | "classifieds" | "tenders";

export type FeatureKey =
  | "news_preview"
  | "news_full_article"
  | "news_archives"
  | "jobs_preview"
  | "jobs_apply"
  | "classifieds_preview"
  | "classifieds_contact"
  | "tenders_preview"
  | "tenders_response";

export type EntitlementValue = boolean | number | "unlimited" | "lt_1_year";

export type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  module: SubscriptionModuleKey;
  description?: string;
};

export type SubscriptionCommerceConfig = {
  provider: "local" | "woocommerce-subscriptions";
  productKey: string;
  productId?: number | null;
  annualProductKey?: string | null;
  annualProductId?: number | null;
  variationId?: number | null;
  status: "draft" | "ready";
};

export type SubscriptionPlanConfig = {
  id: SubscriptionPlanId;
  label: string;
  monthlyPriceAr: number;
  description: string;
  cta: string;
  highlighted?: boolean;
  entitlements: Record<FeatureKey, EntitlementValue>;
  commerce: SubscriptionCommerceConfig;
};

export type AnnualPlanPricing = {
  available: boolean;
  grossAmountAr: number;
  regularPriceAr?: number | null;
  finalAmountAr?: number | null;
  savingsAmountAr: number;
  savingsPercent: number;
};

export type SubscriptionPlanPricingConfig = {
  planId: SubscriptionPlanId;
  monthlyPriceAr: number;
  monthlyRegularPriceAr?: number | null;
  annual: AnnualPlanPricing;
};

export type SubscriptionPricingConfigResult = {
  generatedAt: string;
  stagingBypassAvailable?: boolean;
  plans: Record<SubscriptionPlanId, SubscriptionPlanPricingConfig>;
};

export type UserSubscriptionSnapshot = {
  planId: SubscriptionPlanId;
  status: "active" | "trialing" | "past_due" | "canceled" | "none";
  billingProvider: "local" | "papi" | "woocommerce-subscriptions" | "admin_grant";
  accessGrant?: "all_privileges" | null;
  billingPeriod?: BillingPeriod;
  renewsAt?: string | null;
  startedAt?: string | null;
  wcSubscriptionId?: number | null;
  wcCustomerId?: number | null;
  /** Legacy read-only identifier retained while historic orders are audited. */
  stripeCustomerId?: string | null;
};

export type CheckoutSessionResult = {
  checkoutUrl: string;
};

export type BillingHistoryItem = {
  orderId: number;
  orderNumber: string;
  planId: SubscriptionPlanId;
  billingPeriod?: BillingPeriod;
  status: string;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  createdAt?: string | null;
  paidAt?: string | null;
  transactionId?: string | null;
  invoiceUrl?: string | null;
};
