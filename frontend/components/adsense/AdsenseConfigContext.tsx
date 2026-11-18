"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { WordPressPublicSiteConfigResult } from "@/lib/api/wordpress-internal";

type AdsenseSlotsConfig = {
  topBanner: string;
  homeTop: string;
  homeAfterEditorial: string;
  archiveInline: string;
  articleInline: string;
  articleRail: string;
};

type AdsenseMode = "disabled" | "placeholder" | "adsense";

type AdsenseConfigValue = {
  mode: AdsenseMode;
  enabled: boolean;
  clientId: string;
  articleInlineStartAfterBlocks: number;
  articleInlineRepeatEveryBlocks: number;
  slots: AdsenseSlotsConfig;
  isLoaded: boolean;
  canRenderSlot: (slot?: string | null) => boolean;
  shouldRenderPlaceholder: () => boolean;
};

const EMPTY_SLOTS: AdsenseSlotsConfig = {
  topBanner: "",
  homeTop: "",
  homeAfterEditorial: "",
  archiveInline: "",
  articleInline: "",
  articleRail: "",
};

const DEFAULT_VALUE: AdsenseConfigValue = {
  mode: "placeholder",
  enabled: false,
  clientId: "",
  articleInlineStartAfterBlocks: 3,
  articleInlineRepeatEveryBlocks: 4,
  slots: EMPTY_SLOTS,
  isLoaded: false,
  canRenderSlot: () => false,
  shouldRenderPlaceholder: () => true,
};

const AdsenseConfigContext = createContext<AdsenseConfigValue>(DEFAULT_VALUE);

function normalizeAdsenseConfig(config: WordPressPublicSiteConfigResult | null | undefined): AdsenseConfigValue {
  const clientId = config?.adsense?.clientId?.trim() ?? "";
  const rawMode = config?.adsense?.mode;
  const mode: AdsenseMode = rawMode === "disabled" || rawMode === "adsense" || rawMode === "placeholder" ? rawMode : "placeholder";
  const enabled = mode === "adsense" && Boolean(config?.adsense?.enabled) && clientId.length > 0;
  const articleInlineStartAfterBlocks = Math.max(1, Number(config?.adsense?.articleInlineStartAfterBlocks ?? 3) || 3);
  const articleInlineRepeatEveryBlocks = Math.max(1, Number(config?.adsense?.articleInlineRepeatEveryBlocks ?? 4) || 4);
  const slots: AdsenseSlotsConfig = {
    topBanner: config?.adsense?.slots?.topBanner?.trim() ?? "",
    homeTop: config?.adsense?.slots?.homeTop?.trim() ?? "",
    homeAfterEditorial: config?.adsense?.slots?.homeAfterEditorial?.trim() ?? "",
    archiveInline: config?.adsense?.slots?.archiveInline?.trim() ?? "",
    articleInline: config?.adsense?.slots?.articleInline?.trim() ?? "",
    articleRail: config?.adsense?.slots?.articleRail?.trim() ?? "",
  };

  return {
    mode,
    enabled,
    clientId,
    articleInlineStartAfterBlocks,
    articleInlineRepeatEveryBlocks,
    slots,
    isLoaded: Boolean(config),
    canRenderSlot: (slot?: string | null) => {
      if (mode === "placeholder") {
        return true;
      }
      if (mode !== "adsense") {
        return false;
      }
      return enabled && Boolean(slot && slot.trim().length > 0);
    },
    shouldRenderPlaceholder: () => mode === "placeholder",
  };
}

export function AdsenseConfigProvider({ children }: { children: React.ReactNode }) {
  const [siteConfig, setSiteConfig] = useState<WordPressPublicSiteConfigResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/public/site-config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("site-config-unavailable");
        }
        return response.json() as Promise<WordPressPublicSiteConfigResult>;
      })
      .then((config) => {
        if (!isMounted) {
          return;
        }
        setSiteConfig(config);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setSiteConfig(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => normalizeAdsenseConfig(siteConfig), [siteConfig]);

  return <AdsenseConfigContext.Provider value={value}>{children}</AdsenseConfigContext.Provider>;
}

export function useAdsenseConfig() {
  return useContext(AdsenseConfigContext);
}
