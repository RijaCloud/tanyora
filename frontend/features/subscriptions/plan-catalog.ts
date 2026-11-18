import type { BillingPeriod, FeatureKey, SubscriptionPlanId, SubscriptionPricingConfigResult } from "@/types/subscriptions";
import type { WordPressAccessMatrix } from "@/lib/api/wordpress-internal";
import {
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_MODULE_LABELS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLAN_ORDER,
  type SubscriptionModuleLabel,
} from "@/config/subscription-plans";

export type PricingFeatureItem = {
  text: string;
};

export type PricingSection = {
  title: string;
  features: PricingFeatureItem[];
};

export type PricingPlan = {
  id: SubscriptionPlanId;
  label: string;
  monthlyPriceAr: number;
  displayPriceAr: number;
  originalPriceAr?: number | null;
  savingsLabel?: string | null;
  billingLabel: string;
  billingPeriod: BillingPeriod;
  annualAvailable: boolean;
  description: string;
  pricingDescription: string;
  summaryHighlights: string[];
  cta: string;
  highlighted?: boolean;
  selectable: boolean;
  disabledLabel?: string | null;
  sections: PricingSection[];
};

function humanLimit(limit: boolean | number | "unlimited" | "lt_1_year"): string {
  if (limit === true) return "Illimite";
  if (limit === false) return "X";
  if (limit === "unlimited") return "Illimite";
  if (limit === "lt_1_year") return "< 1 an";
  return String(limit);
}

function sectionFeatures(planId: SubscriptionPlanId, keys: FeatureKey[]): PricingFeatureItem[] {
  const entitlements = SUBSCRIPTION_PLANS[planId].entitlements;
  return keys.map((key) => {
    const feature = SUBSCRIPTION_FEATURES.find((item) => item.key === key);
    return {
      text: `${feature?.label ?? key}: ${humanLimit(entitlements[key])}`,
    };
  });
}

function formatPlanCount(count: number, suffix?: string): string {
  if (!Number.isFinite(count) || count <= 0) {
    return "X";
  }

  return suffix ? `${count} ${suffix}` : String(count);
}

function planMeetsMinimum(planId: SubscriptionPlanId, minimumPlan: SubscriptionPlanId) {
  const order: Record<SubscriptionPlanId, number> = {
    free: 0,
    essentiel: 1,
    business: 2,
  };

  return order[planId] >= order[minimumPlan];
}

function humanTenderAccess(planId: SubscriptionPlanId, minimumPlan: SubscriptionPlanId | undefined) {
  if (!minimumPlan) {
    return "X";
  }

  return planMeetsMinimum(planId, minimumPlan) ? "Oui" : "X";
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function buildPricingDescription(
  planId: SubscriptionPlanId,
  accessMatrix: WordPressAccessMatrix | null,
): string {
  const classifiedMonthlyPosts = accessMatrix?.classifieds.monthlyPosts[planId] ?? 0;
  const classifiedMaxPhotos = accessMatrix?.classifieds.maxPhotos[planId] ?? 0;
  const postLabel = pluralize(classifiedMonthlyPosts, "annonce", "annonces");
  const photoLabel = pluralize(classifiedMaxPhotos, "photo", "photos");

  switch (planId) {
    case "free":
      return `Lisez les articles en accès libre et les aperçus des articles réservés aux abonnés. Consultez les opportunités et publiez **${classifiedMonthlyPosts} ${postLabel} gratuite** avec **${classifiedMaxPhotos} ${photoLabel}** sur Tanyora.`;
    case "essentiel":
      return `Gagnez en visibilité et accélérez vos opportunités. Publiez jusqu'à **${classifiedMonthlyPosts} ${postLabel}** avec **${classifiedMaxPhotos} ${photoLabel}**, contactez directement les annonceurs, accédez aux archives récentes de **moins d'1 an** et diffusez vos offres d'emploi auprès d'une audience qualifiée.`;
    case "business":
      return `Passez à la vitesse supérieure avec l'offre complète pour entreprises. Publiez jusqu'à **${classifiedMonthlyPosts} ${postLabel}** avec **${classifiedMaxPhotos} ${photoLabel}**, recrutez efficacement, accédez aux archives récentes de **moins d'1 an** et bénéficiez d'un accès complet aux appels d'offres, avec possibilité de **répondre aux demandes de proposition**.`;
    default:
      return "";
  }
}

function buildSummaryHighlights(
  planId: SubscriptionPlanId,
  accessMatrix: WordPressAccessMatrix | null,
): string[] {
  const classifiedMonthlyPosts = accessMatrix?.classifieds.monthlyPosts[planId] ?? 0;
  const classifiedMaxPhotos = accessMatrix?.classifieds.maxPhotos[planId] ?? 0;
  const jobsMonthlyPosts = accessMatrix?.jobs.monthlyPosts[planId] ?? 0;

  switch (planId) {
    case "free":
      return [
        `${classifiedMonthlyPosts} annonce incluse`,
        `${classifiedMaxPhotos} photos / annonce`,
        "Articles en accès libre",
      ];
    case "essentiel":
      return [
        `${classifiedMonthlyPosts} annonces / mois`,
        `${classifiedMaxPhotos} photos / annonce`,
        `${jobsMonthlyPosts} offre${jobsMonthlyPosts > 1 ? "s" : ""} d'emploi / mois`,
      ];
    case "business":
      return [
        `${classifiedMonthlyPosts} annonces / mois`,
        `${classifiedMaxPhotos} photos / annonce`,
        "Appels d'offres complets",
      ];
    default:
      return [];
  }
}

function buildPlanSections(
  planId: SubscriptionPlanId,
  accessMatrix: WordPressAccessMatrix | null,
): PricingSection[] {
  const sections: Array<{ title: SubscriptionModuleLabel; features: PricingFeatureItem[] }> = [
    {
      title: SUBSCRIPTION_MODULE_LABELS.news,
      features: [
        { text: "Articles en accès libre : inclus" },
        { text: planId === "free"
          ? "Articles réservés aux abonnés : aperçu uniquement"
          : planId === "essentiel"
            ? "Articles réservés Essentiel : lecture complète"
            : "Articles réservés Essentiel et Business : lecture complète" },
        ...sectionFeatures(planId, ["news_archives"]),
      ],
    },
    {
      title: SUBSCRIPTION_MODULE_LABELS.jobs,
      features: [
        ...sectionFeatures(planId, ["jobs_preview", "jobs_apply"]),
        {
          text: `Publication d'offres d'emploi: ${formatPlanCount(accessMatrix?.jobs.monthlyPosts[planId] ?? 0, "/ mois")}`,
        },
      ],
    },
    {
      title: SUBSCRIPTION_MODULE_LABELS.classifieds,
      features: [
        ...sectionFeatures(planId, ["classifieds_preview", "classifieds_contact"]),
        {
          text: `Annonces incluses: ${formatPlanCount(accessMatrix?.classifieds.monthlyPosts[planId] ?? 0, "/ mois")}`,
        },
        {
          text: `Photos par annonce: ${formatPlanCount(accessMatrix?.classifieds.maxPhotos[planId] ?? 0)}`,
        },
      ],
    },
    {
      title: SUBSCRIPTION_MODULE_LABELS.tenders,
      features: [
        {
          text: `Appels d'offres inclus: ${formatPlanCount(accessMatrix?.tenders.monthlyPosts[planId] ?? 0, "/ mois")}`,
        },
        {
          text: `Consultation détaillée: ${humanTenderAccess(planId, accessMatrix?.tenders.minimumPlan)}`,
        },
        {
          text: `Répondre / contacter: ${humanTenderAccess(planId, accessMatrix?.tenders.responseMinimumPlan)}`,
        },
      ],
    },
  ];

  return sections;
}

export function buildPricingPlans(params?: {
  billingPeriod?: BillingPeriod;
  pricingConfig?: SubscriptionPricingConfigResult | null;
  accessMatrix?: WordPressAccessMatrix | null;
}): PricingPlan[] {
  const billingPeriod = params?.billingPeriod ?? "monthly";
  const pricingConfig = params?.pricingConfig ?? null;
  const accessMatrix = params?.accessMatrix ?? null;
  const visiblePlanOrder = billingPeriod === "annual"
    ? SUBSCRIPTION_PLAN_ORDER.filter((planId) => planId !== "free")
    : SUBSCRIPTION_PLAN_ORDER;

  return visiblePlanOrder.map((planId) => {
    const plan = SUBSCRIPTION_PLANS[planId];

    const monthlyPricing = pricingConfig?.plans?.[planId]?.monthlyPriceAr;
    const resolvedMonthlyPriceAr = typeof monthlyPricing === "number" && monthlyPricing >= 0
      ? monthlyPricing
      : plan.monthlyPriceAr;
    const annualPricing = pricingConfig?.plans?.[planId]?.annual;
    const annualAvailable = planId !== "free" && Boolean(annualPricing?.available && typeof annualPricing.finalAmountAr === "number" && annualPricing.finalAmountAr >= 0);
    const useAnnual = billingPeriod === "annual";
    // A configured annual WooCommerce product can include a discount. Until it
    // exists, show the honest twelve-month total instead of the monthly price.
    const annualDisplayPriceAr = annualAvailable
      ? annualPricing?.finalAmountAr ?? resolvedMonthlyPriceAr
      : annualPricing?.grossAmountAr ?? resolvedMonthlyPriceAr * 12;
    const displayPriceAr = useAnnual ? annualDisplayPriceAr : resolvedMonthlyPriceAr;
    const regularPriceAr = useAnnual ? annualPricing?.regularPriceAr : pricingConfig?.plans?.[planId]?.monthlyRegularPriceAr;
    const originalPriceAr = typeof regularPriceAr === "number" && Number.isFinite(regularPriceAr) && regularPriceAr > displayPriceAr
      ? regularPriceAr
      : useAnnual && annualAvailable ? annualPricing?.grossAmountAr ?? null : null;
    const savingsLabel = useAnnual && annualAvailable && annualPricing && annualPricing.savingsAmountAr > 0
      ? `Economisez ${Math.round(annualPricing.savingsAmountAr).toLocaleString("fr-FR")} Ar`
      : null;

    return {
      id: plan.id,
      label: plan.label,
      monthlyPriceAr: resolvedMonthlyPriceAr,
      displayPriceAr,
      originalPriceAr,
      savingsLabel,
      billingLabel: planId === "free"
        ? ""
        : useAnnual && annualAvailable
          ? "Facturation annuelle"
          : billingPeriod === "annual"
            ? "Total annuel"
            : "Facturation mensuelle",
      billingPeriod,
      annualAvailable,
      description: plan.description,
      pricingDescription: buildPricingDescription(planId, accessMatrix),
      summaryHighlights: buildSummaryHighlights(planId, accessMatrix),
      cta: plan.cta,
      highlighted: plan.highlighted,
      selectable: planId === "free" || billingPeriod === "monthly" || annualAvailable,
      disabledLabel: null,
      sections: buildPlanSections(planId, accessMatrix),
    };
  });
}
