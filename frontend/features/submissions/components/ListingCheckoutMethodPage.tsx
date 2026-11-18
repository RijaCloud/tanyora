"use client";

import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListingCheckoutAction, ListingCheckoutKind, PricingCatalogItem } from "@/lib/api/wordpress-internal";
import { getHumanPricingLabel } from "@/lib/pricing/humanize-pricing";
import { formatMoneyAmount } from "@/lib/pricing/format-money";
import { trackCheckoutStarted, trackListingPublished } from "@/lib/analytics/ga4";

type ListingQuoteResponse = {
  quote: { listingId: number; kind: ListingCheckoutKind; action: ListingCheckoutAction; pricingCode: string; title: string; imageCount?: number };
  pricing: PricingCatalogItem | null;
  allPrivileges?: boolean;
};

type ListingCheckoutMethodPageProps = {
  listingId: number;
  returnTo: string;
  kind: ListingCheckoutKind;
  action: ListingCheckoutAction;
  scheduledPublishAt?: string;
};

function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />;
}

function formatPrice(value: number | null, currency: string | null) {
  return value ? formatMoneyAmount(value, { currency }) : "Prix indisponible";
}

function sanitizeReturnPath(pathname: string) {
  return pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/profil/petites-annonces";
}

function formatScheduledDate(value: string) {
  const parsed = new Date(value.trim());
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString("fr-FR") : "";
}

export function ListingCheckoutMethodPage({ listingId, returnTo, kind, action, scheduledPublishAt = "" }: ListingCheckoutMethodPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricingCode, setPricingCode] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [quoteImageCount, setQuoteImageCount] = useState(0);
  const [catalogItem, setCatalogItem] = useState<PricingCatalogItem | null>(null);
  const [allPrivileges, setAllPrivileges] = useState(false);
  const requestIdRef = useRef(crypto.randomUUID());
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  const safeReturnTo = useMemo(() => sanitizeReturnPath(returnTo), [returnTo]);
  const analyticsContentType = kind === "classified" || kind === "job" || kind === "tender" ? kind : undefined;
  const displayLabel = useMemo(() => {
    if (pricingCode === "classified_post_30d_1_photo") return quoteImageCount <= 0 ? "Annonce de base - Sans photo" : "Annonce de base - 1 photo";
    return catalogItem?.name?.trim() && catalogItem.name !== pricingCode ? catalogItem.name : getHumanPricingLabel(pricingCode, listingTitle);
  }, [catalogItem?.name, listingTitle, pricingCode, quoteImageCount]);
  const orderType = action === "boost" ? "Mise en avant" : "Publication";

  useEffect(() => {
    let isCancelled = false;
    async function loadQuote() {
      try {
        const response = await fetch("/api/billing/listing/quote", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ listingId, action }), cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as (ListingQuoteResponse & { error?: string }) | null;
        if (!response.ok || !payload?.quote?.pricingCode) throw new Error(payload?.error || "Impossible de charger la tarification.");
        if (!isCancelled) {
          setPricingCode(payload.quote.pricingCode);
          setListingTitle(payload.quote.title || "");
          setQuoteImageCount(Number(payload.quote.imageCount || 0));
          setCatalogItem(payload.pricing || null);
          setAllPrivileges(payload.allPrivileges === true);
        }
      } catch (nextError) {
        if (!isCancelled) setError(nextError instanceof Error ? nextError.message : "Impossible de charger la tarification.");
      } finally {
        if (!isCancelled) setIsLoadingCatalog(false);
      }
    }
    loadQuote();
    return () => { isCancelled = true; };
  }, [action, listingId]);

  async function handleContinue() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/billing/checkout/listing", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ listingId, action, paymentMethod: "papi", requestId: requestIdRef.current, returnTo: safeReturnTo, scheduledPublishAt: action === "post" ? scheduledPublishAt : "" }) });
      const data = (await response.json().catch(() => null)) as { checkoutUrl?: string; accessGrant?: string; error?: string } | null;
      if (!response.ok) throw new Error(data?.error || "Impossible de lancer le paiement pour le moment.");
      if (data?.accessGrant === "all_privileges") {
        if (analyticsContentType) {
          trackListingPublished(analyticsContentType, scheduledPublishAt ? "scheduled" : "immediate");
        }
        router.replace(safeReturnTo);
        router.refresh();
        return;
      }
      if (!data?.checkoutUrl) throw new Error(data?.error || "Impossible de lancer le paiement pour le moment.");
      trackCheckoutStarted("listing", analyticsContentType);
      window.location.href = data.checkoutUrl;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Une erreur est survenue.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ui-page-soft flex min-h-screen items-center px-4 py-10 md:px-6 md:py-14">
      <section className="ui-card mx-auto w-full max-w-[640px] overflow-hidden rounded-[32px] shadow-[0_28px_80px_rgba(35,12,13,0.12)]">
        <header className="border-b border-black/5 bg-[linear-gradient(135deg,_#161313,_#302022)] px-6 py-8 text-center text-white md:px-10 md:py-10">
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-white/10"><LockKeyhole className="size-5" aria-hidden="true" /></span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb6b8]">{allPrivileges ? "Accès administrateur" : "Paiement sécurisé"}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{allPrivileges ? "Activer votre contenu" : "Finaliser votre paiement"}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/70">{allPrivileges ? "Votre accès All privileges active ce contenu sans paiement." : "Votre contenu sera activé dès que le paiement sera confirmé."}</p>
        </header>

        <div className="p-6 md:p-8">
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-soft)] p-5">
            <p className="ui-text-soft text-xs font-semibold uppercase tracking-[0.18em]">{orderType}</p>
            <h2 className="ui-text-main mt-3 text-2xl font-semibold">{isLoadingCatalog ? "Chargement..." : displayLabel}</h2>
            <p className="ui-text-main mt-5 text-3xl font-black leading-none">{isLoadingCatalog ? "..." : allPrivileges ? "Inclus" : formatPrice(catalogItem?.price ?? null, catalogItem?.currency ?? null)}</p>
            {action === "post" && scheduledPublishAt && formatScheduledDate(scheduledPublishAt) ? <p className="ui-text-muted mt-3 text-sm">Diffusion prévue le {formatScheduledDate(scheduledPublishAt)}.</p> : null}
          </div>

          <div className="mt-6 flex gap-3 rounded-2xl border border-[#d61f26]/15 bg-[#d61f26]/5 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#d61f26]" aria-hidden="true" />
              <p className="ui-text-muted text-sm leading-6">{allPrivileges ? (action === "boost" ? "La mise en avant sera activée immédiatement." : "Votre publication sera activée immédiatement.") : `Vous choisirez votre moyen de paiement à l'étape suivante. ${action === "boost" ? "La mise en avant sera ensuite activée." : "Votre publication sera ensuite activée."}`}</p>
          </div>

          {error ? <p className="mt-5 rounded-2xl border border-[#f1b4b7] bg-[#fff4f5] px-4 py-3 text-sm text-[#9f1f28] dark:border-[#6b2023] dark:bg-[#38181a] dark:text-[#ffd7d8]">{error}</p> : null}

          <div className="mt-7 space-y-3">
            <button type="button" onClick={handleContinue} disabled={isSubmitting || isLoadingCatalog || !catalogItem} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#27624f] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#c51d22] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? <><Spinner /><span>{allPrivileges ? "Activation..." : "Ouverture du paiement..."}</span></> : <><span>{allPrivileges ? (action === "boost" ? "Mettre en avant gratuitement" : "Publier gratuitement") : "Procéder au paiement"}</span><ArrowRight className="size-4" aria-hidden="true" /></>}
            </button>
            <button type="button" onClick={() => router.push(safeReturnTo)} disabled={isSubmitting} className="ui-border ui-text-main w-full rounded-2xl border px-5 py-3.5 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-60">Retour à mes contenus</button>
          </div>
        </div>
      </section>
    </main>
  );
}
