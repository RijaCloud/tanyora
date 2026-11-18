"use client";

import type { BillingPeriod } from "@/types/subscriptions";
import type { PricingPlan } from "@/features/subscriptions/plan-catalog";
import { formatMoneyAmount } from "@/lib/pricing/format-money";

type PricingCardProps = {
  plan: PricingPlan;
  onSelect: (planId: PricingPlan["id"], billingPeriod: BillingPeriod) => void | Promise<void>;
  isLoading?: boolean;
  isDataLoading?: boolean;
  isDataUnavailable?: boolean;
};

function renderHighlightedDescription(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    const isStrong = part.startsWith("**") && part.endsWith("**");
    const value = isStrong ? part.slice(2, -2) : part;

    return isStrong ? (
      <strong key={`${value}-${index}`} className="font-semibold ui-text-main">
        {value}
      </strong>
    ) : (
      <span key={`${value}-${index}`}>{value}</span>
    );
  });
}

function formatPriceAr(value: number): string {
  return formatMoneyAmount(value, { currency: "MGA", zeroLabel: "Gratuit", useArForMga: true });
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}

export function PricingCard({ plan, onSelect, isLoading = false, isDataLoading = false, isDataUnavailable = false }: PricingCardProps) {
  const cardClass = `ui-surface ui-motion-standard relative flex h-full min-h-[420px] flex-col rounded-[28px] border-2 p-5 transition lg:p-6 ${
    plan.highlighted
      ? "border-[#27624f] shadow-[0_18px_50px_rgba(214,31,38,0.18)]"
      : "ui-border hover:border-[#27624f] hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
  } ${isLoading ? "scale-[0.99]" : "hover:-translate-y-1"}`;

  const headerClass = `mb-3 ${plan.highlighted ? "mt-4" : ""}`;

  const buttonClass = `ui-motion-standard mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition active:scale-[0.98] ${
    plan.highlighted
      ? "border-[#27624f] bg-[#27624f] text-white hover:bg-white hover:text-[#27624f]"
      : "border-[#111111] bg-[#111111] text-white hover:border-[#27624f] hover:bg-[var(--surface-1)] hover:text-[#27624f] focus-visible:border-[#27624f] focus-visible:text-[#27624f] dark:bg-white dark:text-[#111111] dark:hover:bg-[var(--surface-3)] dark:hover:text-white dark:focus-visible:bg-[var(--surface-3)] dark:focus-visible:text-white"
  } ${isLoading ? "cursor-wait opacity-90" : ""} ${!plan.selectable ? "cursor-not-allowed opacity-60" : ""}`;

  return (
    <article className={cardClass}>
      {plan.highlighted ? (
        <div className="absolute -top-4 left-6 rounded-full bg-[#27624f] px-4 py-2 text-[11px] font-bold uppercase leading-none tracking-[0.04em] text-white">
          Le plus populaire
        </div>
      ) : null}

      <header className={headerClass}>
        <h3 className="ui-text-main text-4xl font-black uppercase leading-none tracking-tight">{plan.label}</h3>
      </header>

      <div className="ui-border mb-3 border-b pb-4">
        {isDataLoading ? (
          <div className="space-y-3" aria-hidden="true">
            <div className="h-12 w-36 animate-pulse rounded-lg bg-[var(--surface-3)] motion-reduce:animate-none" />
            <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface-3)] motion-reduce:animate-none" />
          </div>
        ) : <>
        {plan.originalPriceAr && plan.originalPriceAr > plan.displayPriceAr ? (
          <p className="ui-text-soft text-sm line-through">{formatPriceAr(plan.originalPriceAr)}</p>
        ) : null}
        <p className="ui-text-main mt-1 text-5xl font-black leading-none">{formatPriceAr(plan.displayPriceAr)}</p>
        {plan.billingLabel ? <p className="ui-text-soft mt-2 text-sm">{plan.billingLabel}</p> : null}
        {plan.savingsLabel ? <p className="mt-1.5 text-sm font-semibold text-[#27624f]">{plan.savingsLabel}</p> : null}
        </>}
      </div>

      <div className="ui-surface-soft ui-border mb-4 rounded-[22px] border p-4">
        {isDataLoading ? (
          <div className="space-y-3" aria-hidden="true">
            <div className="h-4 w-full animate-pulse rounded bg-[var(--surface-3)] motion-reduce:animate-none" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--surface-3)] motion-reduce:animate-none" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--surface-3)] motion-reduce:animate-none" />
            <div className="flex flex-wrap gap-2 pt-2">
              {[0, 1, 2].map((item) => <div key={item} className="h-8 w-28 animate-pulse rounded-full bg-[var(--surface-3)] motion-reduce:animate-none" />)}
            </div>
          </div>
        ) : <>
        <p className="ui-text-main text-sm leading-7">{renderHighlightedDescription(plan.pricingDescription)}</p>
        {plan.summaryHighlights.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {plan.summaryHighlights.map((highlight) => (
              <span
                key={highlight}
                className="ui-surface inline-flex items-center rounded-full border ui-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ui-text-main"
              >
                {highlight}
              </span>
            ))}
          </div>
        ) : null}
        </>}
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => onSelect(plan.id, plan.billingPeriod)}
        disabled={isDataLoading || isLoading || !plan.selectable}
        className={buttonClass}
      >
        {isDataUnavailable ? "Indisponible" : isDataLoading ? "Chargement..." : isLoading ? (
          <>
            <LoadingDots />
            <span>Redirection...</span>
          </>
        ) : !plan.selectable ? (
          plan.disabledLabel || "Annuel indisponible"
        ) : (
          plan.cta
        )}
      </button>
    </article>
  );
}
