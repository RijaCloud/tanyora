"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

import { useAdsenseConfig } from "@/components/adsense/AdsenseConfigContext";
import { useCookieConsent } from "@/components/privacy/CookieConsentProvider";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdsenseSlotProps = {
  slot?: string | null;
  className?: string;
  style?: CSSProperties;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  layoutKey?: string;
  fullWidthResponsive?: boolean;
  placeholderLabel?: string;
};

export function AdsenseSlot({
  slot,
  className = "",
  style,
  format = "auto",
  layoutKey,
  fullWidthResponsive = true,
  placeholderLabel = "AdSense ici",
}: AdsenseSlotProps) {
  const slotRef = useRef<HTMLModElement | null>(null);
  const { mode, clientId, canRenderSlot, shouldRenderPlaceholder } = useAdsenseConfig();
  const { ready, hasConsent } = useCookieConsent();

  useEffect(() => {
    if (!ready || !hasConsent("advertising") || !canRenderSlot(slot) || !slotRef.current || typeof window === "undefined") {
      return;
    }

    if (slotRef.current.dataset.adsbygoogleStatus) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // The Google script can still be loading on the first paint.
    }
  }, [canRenderSlot, hasConsent, ready, slot]);

  if (shouldRenderPlaceholder()) {
    return (
      <div
        className={`flex items-center justify-center rounded-[12px] border border-dashed border-[#E4B8BB] bg-[#FFF6F6] px-4 py-6 text-center text-sm font-semibold text-[#27624f] ${className}`.trim()}
        style={style}
      >
        {placeholderLabel}
      </div>
    );
  }

  if (!ready || !hasConsent("advertising") || !canRenderSlot(slot) || !clientId || mode !== "adsense") {
    return null;
  }

  return (
    <ins
      ref={slotRef}
      className={`adsbygoogle block ${className}`.trim()}
      style={style}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-ad-layout-key={layoutKey}
      data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
    />
  );
}
