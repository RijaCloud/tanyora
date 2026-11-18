"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PricingGrid } from "@/features/subscriptions/components/PricingGrid";
import { ConfirmFreeDowngradeDialog } from "@/features/subscriptions/components/ConfirmFreeDowngradeDialog";
import { buildPricingPlans } from "@/features/subscriptions/plan-catalog";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import type { BillingPeriod, SubscriptionPlanId, SubscriptionPricingConfigResult } from "@/types/subscriptions";
import type { WordPressPublicSiteConfigResult } from "@/lib/api/wordpress-internal";

function hasCompletePricingData(pricing: SubscriptionPricingConfigResult, site: WordPressPublicSiteConfigResult) {
  const matrix = site?.accessMatrix;
  return (["free", "essentiel", "business"] as const).every((id) => {
    const plan = pricing?.plans?.[id];
    const counts = [matrix?.classifieds?.monthlyPosts?.[id], matrix?.classifieds?.maxPhotos?.[id], matrix?.jobs?.monthlyPosts?.[id], matrix?.tenders?.monthlyPosts?.[id]];
    return typeof plan?.monthlyPriceAr === "number" && Number.isFinite(plan.monthlyPriceAr) && plan.monthlyPriceAr >= 0
      && typeof plan.annual?.available === "boolean"
      && typeof plan.annual.grossAmountAr === "number" && Number.isFinite(plan.annual.grossAmountAr)
      && (!plan.annual.available || (typeof plan.annual.finalAmountAr === "number" && Number.isFinite(plan.annual.finalAmountAr) && plan.annual.finalAmountAr >= 0))
      && counts.every((count) => typeof count === "number" && Number.isFinite(count) && count >= 0);
  });
}

export default function PricingPage() {
  const router = useRouter();
  const { isLoggedIn, refreshSession, userPlan } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [pricingConfig, setPricingConfig] = useState<SubscriptionPricingConfigResult | null>(null);
  const [siteConfig, setSiteConfig] = useState<WordPressPublicSiteConfigResult | null>(null);
  const [confirmFreeOpen, setConfirmFreeOpen] = useState(false);
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let isMounted = true;
    setDataState("loading");
    Promise.all([
      fetch(`/api/billing/subscription-pricing?ts=${Date.now()}`, { cache: "no-store" }).then(async (response) => {
        if (!response.ok) {
          throw new Error("pricing-unavailable");
        }
        return response.json() as Promise<SubscriptionPricingConfigResult>;
      }),
      fetch(`/api/public/site-config?strict=1&ts=${Date.now()}`, { cache: "no-store" }).then(async (response) => {
        if (!response.ok) {
          throw new Error("site-config-unavailable");
        }
        return response.json() as Promise<WordPressPublicSiteConfigResult>;
      }),
    ]).then(([pricingResult, siteConfigResult]) => {
      if (!isMounted) {
        return;
      }
      if (!hasCompletePricingData(pricingResult, siteConfigResult)) {
        setDataState("error");
        return;
      }
      setPricingConfig(pricingResult);
      setSiteConfig(siteConfigResult);
      setDataState("ready");
    }).catch(() => {
      if (isMounted) setDataState("error");
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const plans = useMemo(
    () => buildPricingPlans({ billingPeriod, pricingConfig, accessMatrix: siteConfig?.accessMatrix ?? null }),
    [billingPeriod, pricingConfig, siteConfig],
  );
  const businessDowngradeBlocked = userPlan === "business";

  function handleSelect(planId: SubscriptionPlanId, selectedPeriod: BillingPeriod) {
    if (!isLoggedIn) {
      router.push("/signin");
      return;
    }

    if (businessDowngradeBlocked && planId === "essentiel") {
      return;
    }

    if (planId === "free") {
      setConfirmFreeOpen(true);
      return;
    }

    router.push(`/checkout?plan=${planId}&period=${selectedPeriod}`);
  }

  return (
    <div className="ui-page min-h-screen">
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-[1320px] px-6 py-16">
          <div className="mb-10 text-center">
            <h1 className="ui-text-main mb-4 text-5xl font-bold">Abonnements Tanyora</h1>
            <p className="ui-text-muted mx-auto max-w-3xl text-xl">
              Choisissez le niveau d'accès adapté à votre lecture, à vos candidatures et à vos usages business sur Tanyora.
            </p>
          </div>

          <div className="mb-10 flex justify-center">
            <div className="ui-card-flat inline-flex rounded-full p-1">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  billingPeriod === "monthly" ? "bg-[#27624f] text-white" : "ui-text-muted"
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("annual")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  billingPeriod === "annual" ? "bg-[#27624f] text-white" : "ui-text-muted"
                }`}
              >
                Annuel
              </button>
            </div>
          </div>

          {dataState === "error" ? (
            <div role="alert" className="ui-card mx-auto mb-8 max-w-xl rounded-[24px] p-6 text-center">
              <p className="ui-text-main font-semibold">Un problème est survenu.</p>
              <p className="ui-text-muted mt-2 text-sm">Merci de revenir dans quelques instants.</p>
            </div>
          ) : null}
          {dataState === "loading" ? <p role="status" className="sr-only">Chargement des tarifs et des détails des formules.</p> : null}
          <PricingGrid
            plans={plans.map((plan) => ({
              ...plan,
              cta: userPlan === plan.id ? "Plan actuel" : plan.cta,
              selectable:
                userPlan === plan.id
                  ? false
                  : businessDowngradeBlocked && plan.id === "essentiel"
                    ? false
                    : plan.selectable,
              disabledLabel:
                userPlan === plan.id
                  ? "Plan actuel"
                  : businessDowngradeBlocked && plan.id === "essentiel"
                  ? "Votre formule actuelle est supérieure"
                  : plan.disabledLabel,
            }))}
            onSelect={handleSelect}
            isDataLoading={dataState === "loading"}
            isDataUnavailable={dataState === "error"}
          />

          <div className="ui-card mt-10 grid gap-4 rounded-[24px] p-6 text-sm ui-text-muted lg:grid-cols-3">
            <div>
              <p className="ui-text-main mb-2 font-semibold">Souscription simple</p>
              <p>Choisissez votre formule, confirmez votre paiement, puis retrouvez votre abonnement directement dans votre espace personnel.</p>
            </div>
            <div>
              <p className="ui-text-main mb-2 font-semibold">Paiement sécurisé</p>
              <p>Vous êtes redirigé vers un espace de paiement sécurisé pour finaliser votre achat en toute confiance.</p>
            </div>
            <div>
              <p className="ui-text-main mb-2 font-semibold">Activation rapide</p>
              <p>Dès validation du paiement, votre formule est associée à votre compte pour débloquer les accès correspondants.</p>
            </div>
          </div>
        </div>
      </div>
      <ConfirmFreeDowngradeDialog
        isOpen={confirmFreeOpen}
        paidPlan={userPlan === "business" || userPlan === "essentiel" ? userPlan : undefined}
        onClose={() => setConfirmFreeOpen(false)}
        onSuccess={async () => {
          await refreshSession();
          router.refresh();
        }}
      />
    </div>
  );
}
