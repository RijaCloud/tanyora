export type AnalyticsContentType = "article" | "classified" | "directory" | "job" | "tender";
export type AnalyticsAuthMethod = "email" | "email_otp" | "google";
export type AnalyticsContactChannel = "email" | "message" | "phone" | "website";
export type AnalyticsPaymentScope = "listing" | "subscription";

type AnalyticsEventParameters = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: "config" | "event" | "consent", target: string, parameters?: AnalyticsEventParameters) => void;
  }
}

let analyticsConsentGranted = false;

export function getAnalyticsMeasurementId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
}

export function configureAnalytics() {
  const measurementId = getAnalyticsMeasurementId();
  if (!measurementId || typeof window === "undefined") return false;

  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
    window.gtag("config", measurementId, { send_page_view: false });
    return true;
  } catch {
    return false;
  }
}

export function setAnalyticsConsent(granted: boolean) {
  analyticsConsentGranted = granted;
  if (!granted || typeof window === "undefined") return;

  // Queue events until gtag.js has finished loading, but only after consent.
  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  } catch {
    // Analytics is optional and must never impact the application.
  }
}

export function disableAnalyticsStorage() {
  if (typeof window === "undefined" || !window.gtag) return;
  try {
    window.gtag("consent", "update", { analytics_storage: "denied" });
  } catch {
    // Analytics is optional and must never impact the application.
  }
}

function sendEvent(name: string, parameters: AnalyticsEventParameters = {}) {
  if (!analyticsConsentGranted || !getAnalyticsMeasurementId() || typeof window === "undefined" || !window.gtag) return;
  try {
    window.gtag("event", name, parameters);
  } catch {
    // Analytics is optional and must never impact the application.
  }
}

export function trackPageView() {
  if (typeof window === "undefined") return;
  sendEvent("page_view", {
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
  });
}

export function trackAuthOpened(mode: "login" | "signup" | "forgot") {
  sendEvent("auth_opened", { auth_mode: mode });
}

export function trackAuthCompleted(action: "login" | "sign_up", method: AnalyticsAuthMethod) {
  sendEvent(action, { method });
}

export function trackContentView(contentType: AnalyticsContentType) {
  sendEvent("content_view", { content_type: contentType });
}

export function trackContactInitiated(contentType: AnalyticsContentType, channel: AnalyticsContactChannel) {
  sendEvent("contact_initiated", { content_type: contentType, contact_channel: channel });
}

export function trackSearchSubmitted(surface: "header" | "directory" | "listing") {
  sendEvent("search_submitted", { search_surface: surface });
}

export function trackFilterApplied(surface: "directory" | "listing", filterType: "category" | "location" | "price") {
  sendEvent("filter_applied", { filter_surface: surface, filter_type: filterType });
}

export function trackListingFormOpened(contentType: Exclude<AnalyticsContentType, "article" | "directory">) {
  sendEvent("listing_form_opened", { content_type: contentType });
}

export function trackListingSaved(contentType: Exclude<AnalyticsContentType, "article" | "directory">, outcome: "created" | "updated") {
  sendEvent("listing_saved", { content_type: contentType, outcome });
}

export function trackListingPublished(contentType: Exclude<AnalyticsContentType, "article" | "directory">, outcome: "immediate" | "scheduled") {
  sendEvent("listing_published", { content_type: contentType, publish_mode: outcome });
}

export function trackCheckoutStarted(scope: AnalyticsPaymentScope, contentType?: Exclude<AnalyticsContentType, "article" | "directory">) {
  sendEvent("checkout_started", { payment_scope: scope, content_type: contentType });
}

export function trackPurchaseCompleted(scope: AnalyticsPaymentScope, contentType?: Exclude<AnalyticsContentType, "article" | "directory">) {
  sendEvent("purchase_completed", { payment_scope: scope, content_type: contentType });
}

export function trackPurchaseFailed(scope: AnalyticsPaymentScope, contentType?: Exclude<AnalyticsContentType, "article" | "directory">) {
  sendEvent("purchase_failed", { payment_scope: scope, content_type: contentType });
}
