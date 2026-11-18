"use client";

import Script from "next/script";

import { useAdsenseConfig } from "@/components/adsense/AdsenseConfigContext";
import { useCookieConsent } from "@/components/privacy/CookieConsentProvider";

export function AdsenseScript() {
  const { mode, enabled, clientId } = useAdsenseConfig();
  const { ready, hasConsent } = useCookieConsent();

  if (!ready || !hasConsent("advertising") || mode === "disabled" || !clientId) {
    return null;
  }
  void enabled;

  return (
    <Script
      id="google-adsense-script"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`}
    />
  );
}
