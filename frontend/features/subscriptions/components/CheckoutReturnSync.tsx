"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SubscriptionPlanId } from "@/types/subscriptions";

type CheckoutReturnSyncProps = {
  planId: SubscriptionPlanId;
  shouldRetry?: boolean;
};

const PLAN_UPDATE_EVENT = "2424-plan-updated";
const RETRY_DELAYS_MS = [0, 1200, 2200];

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function CheckoutReturnSync({ planId, shouldRetry = false }: CheckoutReturnSyncProps) {
  const router = useRouter();
  const hasStartedRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");

  useEffect(() => {
    window.localStorage.setItem("auth-plan", planId);
    window.dispatchEvent(new Event(PLAN_UPDATE_EVENT));
  }, [planId]);

  useEffect(() => {
    if (!shouldRetry || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    let cancelled = false;

    async function runSync() {
      setStatus("syncing");

      for (const delay of RETRY_DELAYS_MS) {
        if (delay > 0) {
          await wait(delay);
        }

        if (cancelled) {
          return;
        }

        try {
          const response = await fetch(`/api/billing/stripe/resync?ts=${Date.now()}`, {
            method: "POST",
            credentials: "include",
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error("sync_failed");
          }

          if (cancelled) {
            return;
          }

          window.localStorage.setItem("auth-plan", planId);
          window.dispatchEvent(new Event(PLAN_UPDATE_EVENT));
          setStatus("done");
          startTransition(() => {
            router.refresh();
          });
          return;
        } catch {
          if (cancelled) {
            return;
          }
        }
      }

      if (!cancelled) {
        setStatus("error");
      }
    }

    runSync().catch(() => {
      if (!cancelled) {
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [planId, router, shouldRetry, startTransition]);

  if (!shouldRetry) {
    return null;
  }

  const isLoading = status === "syncing" || isPending;

  return (
    <div className="mb-8 rounded-[24px] border border-[#F1D5D6] bg-[#fff7f7] px-5 py-4 text-sm leading-6 text-[#6b2023] dark:border-[#6b2023] dark:bg-[#38181a] dark:text-[#ffd7d8] md:px-6">
      {isLoading ? (
        <div className="flex items-center gap-3">
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-[#27624f] border-r-transparent" aria-hidden="true" />
          <p>Activation en cours. Nous mettons à jour votre abonnement et cette page se rafraîchira automatiquement.</p>
        </div>
      ) : null}

      {!isLoading && status === "done" ? <p>Activation presque terminée. Nous actualisons votre espace.</p> : null}

      {!isLoading && status === "error" ? (
        <p>Votre paiement est bien pris en compte. L'activation est encore en cours de vérification et se mettra à jour automatiquement.</p>
      ) : null}
    </div>
  );
}
