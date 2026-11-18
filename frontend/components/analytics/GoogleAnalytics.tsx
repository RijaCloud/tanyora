"use client";

import Script from "next/script";
import { useEffect, useLayoutEffect, useState } from "react";
import { useCookieConsent } from "@/components/privacy/CookieConsentProvider";
import { configureAnalytics, disableAnalyticsStorage, getAnalyticsMeasurementId, setAnalyticsConsent, trackPageView } from "@/lib/analytics/ga4";
import { useLocation } from "@/features/prototype/router-compat";

export function GoogleAnalytics() {
  const { ready, hasConsent } = useCookieConsent();
  const location = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);
  const measurementId = getAnalyticsMeasurementId();
  const canTrack = ready && hasConsent("statistics") && Boolean(measurementId);

  useLayoutEffect(() => {
    setAnalyticsConsent(canTrack);
    if (canTrack) {
      configureAnalytics();
    } else {
      disableAnalyticsStorage();
    }
  }, [canTrack]);

  useEffect(() => {
    if (canTrack && isLoaded) {
      trackPageView();
    }
  }, [canTrack, isLoaded, location.pathname]);

  if (!canTrack) return null;

  return (
    <Script
      id="google-analytics"
      strategy="afterInteractive"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      onLoad={() => {
        setIsLoaded(true);
      }}
    />
  );
}
