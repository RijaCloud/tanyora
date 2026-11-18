"use client";

import { ArrowRight, FlaskConical, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import { formatMoneyAmount } from "@/lib/pricing/format-money";
import type { BillingPeriod, SubscriptionPlanId, SubscriptionPricingConfigResult } from "@/types/subscriptions";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { syncPaidSession } from "@/features/subscriptions/lib/sync-paid-session";

type CheckoutMethodPageProps = {
  planId: SubscriptionPlanId;
  billingPeriod: BillingPeriod;
};

function formatPriceAr(value: number, suffix?: string) {
  return formatMoneyAmount(value, {
    currency: "MGA",
    zeroLabel: "Gratuit",
    suffix,
    useArForMga: true,
  });
}

function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />;
}

export function CheckoutMethodPage({ planId, billingPeriod }: CheckoutMethodPageProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const plan = SUBSCRIPTION_PLANS[planId];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestActivating, setIsTestActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testAccessActivated, setTestAccessActivated] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<SubscriptionPricingConfigResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/billing/subscription-pricing?ts=${Date.now()}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("pricing-unavailable");
        return response.json() as Promise<SubscriptionPricingConfigResult>;
      })
      .then((result) => isMounted && setPricingConfig(result))
      .catch(() => {
        if (isMounted) setError("Un problème est survenu, merci de réessayer plus tard.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const annualPricing = pricingConfig?.plans?.[planId]?.annual;
  const isAnnual = billingPeriod === "annual";
  const monthlyPricing = pricingConfig?.plans?.[planId]?.monthlyPriceAr;
  const monthlyPrice = typeof monthlyPricing === "number" && monthlyPricing >= 0 ? monthlyPricing : plan.monthlyPriceAr;
  const displayPrice = isAnnual && annualPricing?.available && typeof annualPricing.finalAmountAr === "number" ? annualPricing.finalAmountAr : monthlyPrice;
  const regularPrice = isAnnual ? annualPricing?.regularPriceAr : pricingConfig?.plans?.[planId]?.monthlyRegularPriceAr;
  const isZeroPrice = Boolean(pricingConfig && displayPrice === 0 && (!isAnnual || annualPricing?.available));
  const priceSuffix = isAnnual ? "/ an" : "/ mois";

  async function handleContinue() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId, billingPeriod, paymentMethod: "papi", expectedZeroPrice: isZeroPrice }),
      });
      const data = (await response.json().catch(() => null)) as { checkoutUrl?: string; activated?: boolean; planId?: SubscriptionPlanId; error?: string } | null;
      if (response.ok && data?.activated && data.planId === planId) {
        void syncPaidSession(refreshSession, planId).then(() => router.refresh());
        router.replace("/profil");
        return;
      }
      if (!response.ok || !data?.checkoutUrl) {
        throw new Error(data?.error || "Impossible de lancer le paiement pour le moment.");
      }
      window.location.href = data.checkoutUrl;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Une erreur est survenue.");
      setIsSubmitting(false);
    }
  }

  async function handleTestActivation() {
    setError(null);
    setIsTestActivating(true);

    try {
      const response = await fetch("/api/billing/subscription/staging-bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId, billingPeriod }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Impossible d'activer l'accès de test.");
      }
      setTestAccessActivated(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Une erreur est survenue.");
    } finally {
      setIsTestActivating(false);
    }
  }

  return (
    <main className="ui-page-soft flex min-h-screen items-center px-4 py-10 md:px-6 md:py-14">
      <section className="ui-card mx-auto w-full max-w-[640px] overflow-hidden rounded-[32px] shadow-[0_28px_80px_rgba(35,12,13,0.12)]">
        <header className="border-b border-black/5 bg-[linear-gradient(135deg,_#161313,_#302022)] px-6 py-8 text-center text-white md:px-10 md:py-10">
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-white/10"><LockKeyhole className="size-5" aria-hidden="true" /></span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb6b8]">{isZeroPrice ? "Activation de votre formule" : "Paiement sécurisé"}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{isZeroPrice ? "Confirmer votre formule" : "Finaliser votre paiement"}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/70">{isZeroPrice ? "Votre formule sera activée sans paiement." : "Votre abonnement sera activé dès que le paiement sera confirmé."}</p>
        </header>

        <div className="p-6 md:p-8">
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-soft)] p-5">
            <p className="ui-text-soft text-xs font-semibold uppercase tracking-[0.18em]">Votre formule</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="ui-text-main text-2xl font-semibold">{plan.label}</h2>
                <p className="ui-text-muted mt-1 text-sm">{isAnnual ? "Accès annuel" : "Accès mensuel"}</p>
              </div>
              {pricingConfig ? (
                <div className="text-right">
                  {typeof regularPrice === "number" && Number.isFinite(regularPrice) && regularPrice > displayPrice && (!isAnnual || annualPricing?.available) ? <p className="ui-text-soft mb-1 text-sm line-through">{formatPriceAr(regularPrice, priceSuffix)}</p> : null}
                  <p className="ui-text-main text-3xl font-black leading-none">{isAnnual && !annualPricing?.available ? "Indisponible" : formatPriceAr(displayPrice, priceSuffix)}</p>
                </div>
              ) : (
                <span className="h-8 w-32 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" aria-label="Chargement du tarif" />
              )}
            </div>
            {isAnnual && annualPricing?.available && annualPricing.savingsAmountAr > 0 ? (
              <p className="mt-4 text-sm font-semibold text-[#d61f26]">Vous économisez {formatPriceAr(annualPricing.savingsAmountAr)} sur l'année.</p>
            ) : null}
          </div>

          <div className="mt-6 flex gap-3 rounded-2xl border border-[#d61f26]/15 bg-[#d61f26]/5 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#d61f26]" aria-hidden="true" />
            <p className="ui-text-muted text-sm leading-6">{isZeroPrice ? "Aucun paiement n'est nécessaire. Votre formule sera disponible dans votre profil." : "Vous choisirez votre moyen de paiement à l'étape suivante. Votre formule et vos accès resteront disponibles dans votre profil."}</p>
          </div>

          {error ? <p className="mt-5 rounded-2xl border border-[#f1b4b7] bg-[#fff4f5] px-4 py-3 text-sm text-[#9f1f28] dark:border-[#6a2c33] dark:bg-[#351e22] dark:text-[#ffb8bf]">{error}</p> : null}

          {testAccessActivated ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <p className="ui-text-main font-semibold">Accès de test activé</p>
              <p className="ui-text-muted mt-1 text-sm">Votre formule est disponible dès maintenant.</p>
              <button type="button" onClick={() => window.location.assign("/profil")} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">Voir mon profil</button>
            </div>
          ) : null}

          <div className="mt-7 space-y-3">
            <button type="button" onClick={handleContinue} disabled={isSubmitting || isTestActivating || !pricingConfig || (isAnnual && !annualPricing?.available)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#27624f] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#c51d22] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? <><Spinner /><span>{isZeroPrice ? "Activation en cours..." : "Ouverture du paiement..."}</span></> : <><span>{isZeroPrice ? "Activer ma formule" : "Procéder au paiement"}</span><ArrowRight className="size-4" aria-hidden="true" /></>}
            </button>
            {pricingConfig?.stagingBypassAvailable && !testAccessActivated ? (
              <button type="button" onClick={handleTestActivation} disabled={isSubmitting || isTestActivating} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-3.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-500/20 dark:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60">
                {isTestActivating ? <><Spinner /><span>Activation de l'accès de test...</span></> : <><FlaskConical className="size-4" aria-hidden="true" /><span>Activer l'accès de test</span></>}
              </button>
            ) : null}
            <button type="button" onClick={() => router.push("/tarifs")} disabled={isSubmitting || isTestActivating} className="ui-border ui-text-main w-full rounded-2xl border px-5 py-3.5 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-60">Retour aux tarifs</button>
          </div>
        </div>
      </section>
    </main>
  );
}
