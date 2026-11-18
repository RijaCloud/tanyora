"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { syncPaidSession } from "@/features/subscriptions/lib/sync-paid-session";
import type { SubscriptionPlanId } from "@/types/subscriptions";
import { trackPurchaseCompleted, trackPurchaseFailed } from "@/lib/analytics/ga4";

const MAX_STATUS_ATTEMPTS = 6;
const RETRY_DELAY_MS = 2000;
type CheckoutReturnPageClientProps = { selectedPlanId?: SubscriptionPlanId; orderId?: string; orderKey?: string; source?: string };

export function CheckoutReturnPageClient({ selectedPlanId, orderId, orderKey }: CheckoutReturnPageClientProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  async function retryPayment() {
    const normalizedOrderId = Number(orderId || 0);
    if (!normalizedOrderId || !orderKey) return;
    setIsRetrying(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/billing/papi/retry", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: normalizedOrderId, key: orderKey }) });
      const result = (await response.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;
      if (!response.ok || !result?.checkoutUrl) throw new Error(result?.error || "Impossible de relancer le paiement.");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de relancer le paiement.");
    } finally {
      setIsRetrying(false);
    }
  }
  useEffect(() => {
    const normalizedOrderId = Number(orderId || 0);
    if (!Number.isFinite(normalizedOrderId) || normalizedOrderId <= 0) {
      setIsLoading(false); setErrorMessage("Le retour de paiement ne contient pas de commande exploitable."); return;
    }
    let cancelled = false;
    async function checkPayment() {
      for (let attempt = 1; attempt <= MAX_STATUS_ATTEMPTS; attempt += 1) {
        const response = await fetch("/api/billing/papi/status", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: normalizedOrderId, key: orderKey }) });
        const result = (await response.json().catch(() => null)) as { isConfirmed?: boolean; status?: string; planId?: SubscriptionPlanId; error?: string } | null;
        if (!response.ok || !result) throw new Error(result?.error || "Impossible de vérifier votre paiement.");
        if (result.isConfirmed) {
          if (!cancelled) {
            trackPurchaseCompleted("subscription");
            setIsConfirmed(true);
            setIsLoading(false);
            router.replace("/profil");
            void syncPaidSession(refreshSession, result.planId || selectedPlanId).then(() => router.refresh());
          }
          return;
        }
        if (result.status === "failed") { trackPurchaseFailed("subscription"); throw new Error("Le paiement a été refusé ou annulé."); }
        if (attempt < MAX_STATUS_ATTEMPTS) await new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS));
      }
      if (!cancelled) { setIsLoading(false); setErrorMessage("Le paiement est encore en attente de confirmation. Votre accès sera activé dès validation."); }
    }
    checkPayment().catch((error) => { if (!cancelled) { setIsLoading(false); setErrorMessage(error instanceof Error ? error.message : "Impossible de vérifier votre paiement."); } });
    return () => { cancelled = true; };
  }, [orderKey, orderId, refreshSession, router, selectedPlanId]);

  return <main className="ui-page-soft min-h-screen px-4 py-10 md:px-6 md:py-14"><div className="ui-card mx-auto max-w-[720px] rounded-[30px] p-8 text-center md:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">Paiement sécurisé</p><h1 className="ui-text-main mt-4 text-3xl font-semibold">{isConfirmed ? "Paiement confirmé" : isLoading ? "Vérification du paiement" : "Paiement en attente"}</h1><p className="ui-text-muted mx-auto mt-4 max-w-xl text-sm leading-7">{isConfirmed ? "Paiement confirmé. Redirection vers votre profil..." : isLoading ? "Nous vérifions la confirmation sécurisée de votre paiement." : errorMessage}</p>{isLoading ? <span className="mt-8 inline-block size-7 animate-spin rounded-full border-2 border-[#27624f] border-r-transparent" aria-label="Vérification en cours" /> : <div className="mt-8 flex flex-wrap justify-center gap-3">{errorMessage?.includes("refusé") && orderId && orderKey ? <button type="button" onClick={retryPayment} disabled={isRetrying} className="rounded-2xl bg-[#27624f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70">{isRetrying ? "Redirection..." : "Réessayer le paiement"}</button> : null}<Link href="/profil" className="rounded-2xl bg-[#27624f] px-5 py-3 text-sm font-semibold text-white">Voir mon profil</Link><Link href="/tarifs" className="ui-border ui-text-main rounded-2xl border px-5 py-3 text-sm font-semibold">Retour aux tarifs</Link></div>}</div></main>;
}
