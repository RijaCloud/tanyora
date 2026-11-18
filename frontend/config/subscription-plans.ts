import type {
  EntitlementValue,
  FeatureDefinition,
  FeatureKey,
  SubscriptionModuleKey,
  SubscriptionPlanConfig,
  SubscriptionPlanId,
} from "@/types/subscriptions";

export const SUBSCRIPTION_MODULE_LABELS: Record<SubscriptionModuleKey, string> = {
  news: "Actualités",
  jobs: "Recrutement",
  classifieds: "Petites annonces",
  tenders: "Appels d'offres",
};

export type SubscriptionModuleLabel = (typeof SUBSCRIPTION_MODULE_LABELS)[SubscriptionModuleKey];

export const SUBSCRIPTION_FEATURES: FeatureDefinition[] = [
  { key: "news_preview", label: "Aperçu (1 paragraphe)", module: "news" },
  { key: "news_full_article", label: "Article complet", module: "news" },
  { key: "news_archives", label: "Accès aux archives", module: "news" },
  { key: "jobs_preview", label: "Consultation aperçu", module: "jobs" },
  { key: "jobs_apply", label: "Candidater", module: "jobs" },
  { key: "classifieds_preview", label: "Consultation aperçu", module: "classifieds" },
  { key: "classifieds_contact", label: "Achat (Bouton Contacter)", module: "classifieds" },
  { key: "tenders_preview", label: "Consultation aperçu", module: "tenders" },
  { key: "tenders_response", label: "Souscription (réponse)", module: "tenders" },
];

function buildEntitlements(values: Record<FeatureKey, EntitlementValue>) {
  return values;
}

function readProductId(envKey: string, fallback: number) {
  const rawValue = process.env[envKey];
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : NaN;
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function readProductKey(envKey: string, fallback: string) {
  const rawValue = process.env[envKey]?.trim();
  return rawValue || fallback;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlanConfig> = {
  free: {
    id: "free",
    label: "Free",
    monthlyPriceAr: 0,
    description: "Accès gratuit pour consulter les aperçus et découvrir la plateforme.",
    cta: "Continuer en Free",
    entitlements: buildEntitlements({
      news_preview: true,
      news_full_article: "unlimited",
      news_archives: false,
      jobs_preview: true,
      jobs_apply: false,
      classifieds_preview: true,
      classifieds_contact: false,
      tenders_preview: false,
      tenders_response: false,
    }),
    commerce: {
      provider: "local",
      productKey: "plan_free",
      productId: null,
      annualProductKey: null,
      annualProductId: null,
      variationId: null,
      status: "draft",
    },
  },
  essentiel: {
    id: "essentiel",
    label: "Essentiel",
    monthlyPriceAr: 15000,
    description: "Le plan individuel pour lire les articles complets et utiliser les services essentiels.",
    cta: "Choisir Essentiel",
    highlighted: true,
    entitlements: buildEntitlements({
      news_preview: true,
      news_full_article: "unlimited",
      news_archives: "lt_1_year",
      jobs_preview: true,
      jobs_apply: "unlimited",
      classifieds_preview: true,
      classifieds_contact: "unlimited",
      tenders_preview: false,
      tenders_response: false,
    }),
    commerce: {
      provider: "woocommerce-subscriptions",
      productKey: readProductKey("WC_PRODUCT_SKU_ESSENTIEL", "essentiel"),
      productId: readProductId("WC_PRODUCT_ID_ESSENTIEL", 33),
      annualProductKey: readProductKey("WC_PRODUCT_SKU_ESSENTIEL_ANNUAL", "essentiel-12-months"),
      annualProductId: readProductId("WC_PRODUCT_ID_ESSENTIEL_ANNUAL", 0),
      variationId: null,
      status: "ready",
    },
  },
  business: {
    id: "business",
    label: "Business",
    monthlyPriceAr: 75000,
    description: "Le plan complet pour les entreprises avec accès illimité aux services business.",
    cta: "Choisir Business",
    entitlements: buildEntitlements({
      news_preview: true,
      news_full_article: "unlimited",
      news_archives: "unlimited",
      jobs_preview: true,
      jobs_apply: "unlimited",
      classifieds_preview: true,
      classifieds_contact: "unlimited",
      tenders_preview: "unlimited",
      tenders_response: "unlimited",
    }),
    commerce: {
      provider: "woocommerce-subscriptions",
      productKey: readProductKey("WC_PRODUCT_SKU_BUSINESS", "business"),
      productId: readProductId("WC_PRODUCT_ID_BUSINESS", 34),
      annualProductKey: readProductKey("WC_PRODUCT_SKU_BUSINESS_ANNUAL", "business-12-months"),
      annualProductId: readProductId("WC_PRODUCT_ID_BUSINESS_ANNUAL", 0),
      variationId: null,
      status: "ready",
    },
  },
};

export const DEFAULT_SUBSCRIPTION_PLAN_ID: SubscriptionPlanId = "free";

export const SUBSCRIPTION_PLAN_ORDER: SubscriptionPlanId[] = ["free", "essentiel", "business"];
