"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { AdSlotKey } from "@/config/ad-slots";
import type { ResolvedAdItem, ResolvedAdSlot, ResolvedAdSlots } from "@/lib/api/wordpress-internal";

/**
 * `preview` dessine le cadre de chaque emplacement sans contacter aucune régie :
 * c'est le mode de contrôle du placement. `active` sert le contenu réel.
 */
export type AdRegieMode = "disabled" | "placeholder" | "adsense";

type AdSlotContextValue = {
  mode: AdRegieMode;
  showPlaceholders: boolean;
  clientId: string;
  isLoaded: boolean;
  getSlot: (key: AdSlotKey) => ResolvedAdSlot | null;
  getFirstItem: (key: AdSlotKey) => ResolvedAdItem | null;
};

const DEFAULT_VALUE: AdSlotContextValue = {
  mode: "placeholder",
  showPlaceholders: false,
  clientId: "",
  isLoaded: false,
  getSlot: () => null,
  getFirstItem: () => null,
};

const AdSlotContext = createContext<AdSlotContextValue>(DEFAULT_VALUE);

type AdSlotsResponse = {
  mode?: AdRegieMode;
  showPlaceholders?: boolean;
  clientId?: string;
  slots?: ResolvedAdSlots;
};

export function AdSlotProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<AdSlotsResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/public/ad-slots")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("ad-slots-unavailable");
        }
        return (await response.json()) as AdSlotsResponse;
      })
      .then((data) => {
        if (isMounted) {
          setPayload(data);
        }
      })
      .catch((error) => {
        console.error("[ads] chargement des emplacements impossible", error);
        if (isMounted) {
          setPayload(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AdSlotContextValue>(() => {
    const slots = payload?.slots ?? {};
    const rawMode = payload?.mode;
    const mode: AdRegieMode =
      rawMode === "disabled" || rawMode === "adsense" || rawMode === "placeholder" ? rawMode : "placeholder";

    const getSlot = (key: AdSlotKey) => slots[key] ?? null;

    return {
      mode,
      showPlaceholders: payload?.showPlaceholders === true,
      clientId: (payload?.clientId ?? "").trim(),
      isLoaded: payload !== null,
      getSlot,
      getFirstItem: (key: AdSlotKey) => getSlot(key)?.items?.[0] ?? null,
    };
  }, [payload]);

  return <AdSlotContext.Provider value={value}>{children}</AdSlotContext.Provider>;
}

export function useAdSlots() {
  return useContext(AdSlotContext);
}
