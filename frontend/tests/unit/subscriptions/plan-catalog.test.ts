import { describe, expect, it } from "vitest";
import { buildPricingPlans } from "@/features/subscriptions/plan-catalog";
import type { SubscriptionPricingConfigResult } from "@/types/subscriptions";
import type { WordPressAccessMatrix } from "@/lib/api/wordpress-internal";

function createPricingConfig(): SubscriptionPricingConfigResult {
  return {
    generatedAt: "2026-06-11T00:00:00.000Z",
    plans: {
      free: {
        planId: "free",
        monthlyPriceAr: 0,
        annual: {
          available: false,
          grossAmountAr: 0,
          finalAmountAr: null,
          savingsAmountAr: 0,
          savingsPercent: 0,
        },
      },
      essentiel: {
        planId: "essentiel",
        monthlyPriceAr: 18000,
        annual: {
          available: true,
          grossAmountAr: 216000,
          finalAmountAr: 180000,
          savingsAmountAr: 36000,
          savingsPercent: 16.67,
        },
      },
      business: {
        planId: "business",
        monthlyPriceAr: 90000,
        annual: {
          available: false,
          grossAmountAr: 1080000,
          finalAmountAr: null,
          savingsAmountAr: 0,
          savingsPercent: 0,
        },
      },
    },
  };
}

function createAccessMatrix(): WordPressAccessMatrix {
  return {
    news: {
      minimumPlanOptions: [
        { value: "all", label: "Visible pour tous" },
        { value: "essentiel", label: "Essentiel et Business" },
        { value: "business", label: "Business uniquement" },
      ],
    },
    classifieds: {
      monthlyPosts: {
        free: 1,
        essentiel: 5,
        business: 10,
      },
      maxPhotos: {
        free: 2,
        essentiel: 10,
        business: 20,
      },
    },
    jobs: {
      monthlyPosts: {
        free: 0,
        essentiel: 5,
        business: 10,
      },
    },
    tenders: {
      monthlyPosts: {
        free: 0,
        essentiel: 0,
        business: 10,
      },
      minimumPlan: "business",
      responseMinimumPlan: "business",
    },
  };
}

describe("buildPricingPlans", () => {
  it("shows the regular monthly price when the active price is free", () => {
    const pricing = createPricingConfig();
    pricing.plans.essentiel.monthlyPriceAr = 0;
    pricing.plans.essentiel.monthlyRegularPriceAr = 15000;
    const plan = buildPricingPlans({ pricingConfig: pricing }).find((item) => item.id === "essentiel");
    expect(plan?.displayPriceAr).toBe(0);
    expect(plan?.originalPriceAr).toBe(15000);
    pricing.plans.essentiel.monthlyRegularPriceAr = 0;
    expect(buildPricingPlans({ pricingConfig: pricing }).find((item) => item.id === "essentiel")?.originalPriceAr).toBeNull();
  });

  it("uses the annual product's regular price for a free promotion", () => {
    const pricing = createPricingConfig();
    pricing.plans.essentiel.monthlyPriceAr = 0;
    pricing.plans.essentiel.annual.grossAmountAr = 0;
    pricing.plans.essentiel.annual.finalAmountAr = 0;
    pricing.plans.essentiel.annual.regularPriceAr = 140000;
    const plan = buildPricingPlans({ billingPeriod: "annual", pricingConfig: pricing }).find((item) => item.id === "essentiel");
    expect(plan?.displayPriceAr).toBe(0);
    expect(plan?.originalPriceAr).toBe(140000);
  });

  it("keeps an explicitly free annual plan selectable", () => {
    const pricing = createPricingConfig();
    pricing.plans.essentiel.annual.finalAmountAr = 0;
    const plan = buildPricingPlans({ billingPeriod: "annual", pricingConfig: pricing }).find((item) => item.id === "essentiel");
    expect(plan?.annualAvailable).toBe(true);
    expect(plan?.displayPriceAr).toBe(0);
    expect(plan?.selectable).toBe(true);
  });

  it("preserves a monthly price explicitly set to zero", () => {
    const pricing = createPricingConfig();
    pricing.plans.business.monthlyPriceAr = 0;
    expect(buildPricingPlans({ pricingConfig: pricing }).find((item) => item.id === "business")?.displayPriceAr).toBe(0);
  });
  it("uses WooCommerce monthly pricing when available", () => {
    const plans = buildPricingPlans({
      billingPeriod: "monthly",
      pricingConfig: createPricingConfig(),
    });

    const essentiel = plans.find((plan) => plan.id === "essentiel");
    const business = plans.find((plan) => plan.id === "business");

    expect(essentiel?.monthlyPriceAr).toBe(18000);
    expect(essentiel?.displayPriceAr).toBe(18000);
    expect(essentiel?.billingLabel).toBe("Facturation mensuelle");

    expect(business?.monthlyPriceAr).toBe(90000);
    expect(business?.displayPriceAr).toBe(90000);
  });

  it("keeps only paid plans in annual mode", () => {
    const plans = buildPricingPlans({
      billingPeriod: "annual",
      pricingConfig: createPricingConfig(),
    });

    expect(plans.map((plan) => plan.id)).toEqual(["essentiel", "business"]);
  });

  it("uses annual pricing and savings when annual is available", () => {
    const plans = buildPricingPlans({
      billingPeriod: "annual",
      pricingConfig: createPricingConfig(),
    });

    const essentiel = plans.find((plan) => plan.id === "essentiel");

    expect(essentiel?.annualAvailable).toBe(true);
    expect(essentiel?.displayPriceAr).toBe(180000);
    expect(essentiel?.originalPriceAr).toBe(216000);
    expect(essentiel?.savingsLabel).toBe("Economisez 36 000 Ar");
    expect(essentiel?.billingLabel).toBe("Facturation annuelle");
    expect(essentiel?.selectable).toBe(true);
  });

  it("shows the twelve-month total while annual checkout is unavailable", () => {
    const plans = buildPricingPlans({
      billingPeriod: "annual",
      pricingConfig: createPricingConfig(),
    });

    const business = plans.find((plan) => plan.id === "business");

    expect(business?.annualAvailable).toBe(false);
    expect(business?.displayPriceAr).toBe(1080000);
    expect(business?.billingLabel).toBe("Total annuel");
    expect(business?.selectable).toBe(false);
  });

  it("falls back to static monthly pricing when API pricing is missing", () => {
    const plans = buildPricingPlans({
      billingPeriod: "monthly",
      pricingConfig: null,
    });

    const essentiel = plans.find((plan) => plan.id === "essentiel");
    const business = plans.find((plan) => plan.id === "business");

    expect(essentiel?.displayPriceAr).toBe(15000);
    expect(business?.displayPriceAr).toBe(75000);
  });

  it("injects admin-managed quota details into pricing sections", () => {
    const plans = buildPricingPlans({
      billingPeriod: "monthly",
      pricingConfig: createPricingConfig(),
      accessMatrix: createAccessMatrix(),
    });

    const free = plans.find((plan) => plan.id === "free");
    const essentiel = plans.find((plan) => plan.id === "essentiel");

    expect(free?.sections.find((section) => section.title === "Petites annonces")?.features.map((feature) => feature.text)).toContain(
      "Annonces incluses: 1 / mois",
    );
    expect(free?.sections.find((section) => section.title === "Petites annonces")?.features.map((feature) => feature.text)).toContain(
      "Photos par annonce: 2",
    );
    expect(free?.sections.find((section) => section.title === "Recrutement")?.features.map((feature) => feature.text)).toContain(
      "Publication d'offres d'emploi: X",
    );
    expect(essentiel?.sections.find((section) => section.title === "Recrutement")?.features.map((feature) => feature.text)).toContain(
      "Publication d'offres d'emploi: 5 / mois",
    );
    expect(free?.sections.find((section) => section.title === "Appels d'offres")?.features.map((feature) => feature.text)).toContain(
      "Consultation détaillée: X",
    );
    expect(plans.find((plan) => plan.id === "business")?.sections.find((section) => section.title === "Appels d'offres")?.features.map((feature) => feature.text)).toContain(
      "Répondre / contacter: Oui",
    );
  });
});
