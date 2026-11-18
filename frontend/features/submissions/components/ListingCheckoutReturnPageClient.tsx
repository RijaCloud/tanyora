"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackPurchaseCompleted, trackPurchaseFailed } from "@/lib/analytics/ga4";

type Props = { orderId?: string; orderKey?: string; listingId?: number; returnTo: string; status?: string; source?: string; sessionId?: string };
const MAX_ATTEMPTS = 6;

export function ListingCheckoutReturnPageClient({ orderId, orderKey, returnTo }: Props) {
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("Nous vérifions la confirmation sécurisée de votre paiement.");
  const [retrying, setRetrying] = useState(false);
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/profil/petites-annonces";
  useEffect(() => {
    const id = Number(orderId || 0);
    if (!Number.isFinite(id) || id <= 0) { setLoading(false); setMessage("Le retour de paiement ne contient pas de commande exploitable."); return; }
    let cancelled = false;
    async function check() {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        const response = await fetch("/api/billing/papi/status", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: id, key: orderKey }) });
        const data = (await response.json().catch(() => null)) as { isConfirmed?: boolean; status?: string; error?: string } | null;
        if (!response.ok || !data) throw new Error(data?.error || "Impossible de vérifier votre paiement.");
        if (data.isConfirmed) { if (!cancelled) { trackPurchaseCompleted("listing"); setConfirmed(true); setLoading(false); setMessage("Votre paiement est confirmé. Votre publication est maintenant active."); window.setTimeout(() => window.location.replace(safeReturnTo), 1000); } return; }
        if (data.status === "failed") { trackPurchaseFailed("listing"); throw new Error("Le paiement a été refusé ou annulé."); }
        if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }
      if (!cancelled) { setLoading(false); setMessage("Le paiement est encore en attente de confirmation. La publication sera activée dès validation."); }
    }
    check().catch((error) => { if (!cancelled) { setLoading(false); setMessage(error instanceof Error ? error.message : "Impossible de vérifier votre paiement."); } });
    return () => { cancelled = true; };
  }, [orderKey, orderId, safeReturnTo]);
  async function retryPayment() {
    const id = Number(orderId || 0);
    if (!id || !orderKey) return;
    setRetrying(true);
    try {
      const response = await fetch("/api/billing/papi/retry", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: id, key: orderKey }) });
      const result = (await response.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;
      if (!response.ok || !result?.checkoutUrl) throw new Error(result?.error || "Impossible de relancer le paiement.");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de relancer le paiement.");
      setRetrying(false);
    }
  }
  const canRetry = !confirmed && message.includes("refusé") && orderId && orderKey;
  return <main className="ui-page-soft min-h-screen px-4 py-10 md:px-6 md:py-14"><div className="ui-card mx-auto max-w-[720px] rounded-[30px] p-8 text-center md:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">Paiement sécurisé</p><h1 className="ui-text-main mt-4 text-3xl font-semibold">{confirmed ? "Paiement confirmé" : loading ? "Vérification du paiement" : "Paiement en attente"}</h1><p className="ui-text-muted mx-auto mt-4 max-w-xl text-sm leading-7">{message}</p>{loading ? <span className="mt-8 inline-block size-7 animate-spin rounded-full border-2 border-[#27624f] border-r-transparent" /> : <div className="mt-8 flex flex-wrap justify-center gap-3">{canRetry ? <button type="button" onClick={retryPayment} disabled={retrying} className="rounded-2xl bg-[#27624f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70">{retrying ? "Redirection..." : "Réessayer le paiement"}</button> : null}<Link href={safeReturnTo} className="rounded-2xl bg-[#27624f] px-5 py-3 text-sm font-semibold text-white">Retour à mes contenus</Link></div>}</div></main>;
}
