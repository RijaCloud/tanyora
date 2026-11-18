"use client";

import { useState } from "react";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { requestFreeDowngrade } from "@/features/subscriptions/lib/request-free-downgrade";

type ConfirmFreeDowngradeDialogProps = {
  isOpen: boolean;
  paidPlan?: "business" | "essentiel";
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export function ConfirmFreeDowngradeDialog({ isOpen, paidPlan, onClose, onSuccess }: ConfirmFreeDowngradeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);

    try {
      await requestFreeDowngrade();
      await onSuccess();
      onClose();
    } catch (reason) {
      setError(getUserFacingErrorMessage(reason, "Impossible de repasser en formule Free pour le moment."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-free-title"
      onClick={handleClose}
    >
      <div
        className="ui-surface relative w-full max-w-[560px] rounded-[28px] border ui-border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fermer"
          disabled={isSubmitting}
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-[#111111] shadow-lg transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">Confirmation</p>
        <h2 id="confirm-free-title" className="ui-text-main mt-3 max-w-[18ch] text-3xl font-semibold tracking-[-0.03em]">
          Revenir au plan Free ?
        </h2>
        <p className="ui-text-muted mt-4 text-sm leading-7">
          Cette action annule immédiatement votre abonnement payant et remet votre compte sur la formule Free.
          Vous pourrez reprendre une offre payante plus tard si besoin.
        </p>
        <div className="ui-surface-soft ui-text-muted mt-6 rounded-[22px] p-5 text-sm leading-7">
          {paidPlan ? <p>Votre accès {paidPlan === "business" ? "Business" : "Essentiel"} sera retiré dès confirmation.</p> : null}
          <p>Les fonctionnalités réservées aux offres payantes ne seront plus disponibles sur votre compte.</p>
        </div>
        {error ? (
          <p role="alert" className="mt-5 rounded-2xl border border-[#f1b4b7] bg-[#fff4f5] px-4 py-3 text-sm text-[#9f1f28]">
            {error}
          </p>
        ) : null}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClose}
            className="ui-surface ui-text-main inline-flex items-center justify-center rounded-2xl border ui-border px-5 py-3 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Garder mon abonnement
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              handleConfirm().catch(() => undefined);
            }}
            className="inline-flex items-center justify-center rounded-2xl bg-[#27624f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b91c22] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Confirmation..." : "Confirmer le retour au Free"}
          </button>
        </div>
      </div>
    </div>
  );
}
