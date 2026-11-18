import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configureAnalytics,
  setAnalyticsConsent,
  trackContactInitiated,
  trackListingSaved,
  trackPageView,
} from "@/lib/analytics/ga4";

describe("GA4 analytics helpers", () => {
  afterEach(() => {
    setAnalyticsConsent(false);
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not emit anything without a configured measurement id", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    expect(configureAnalytics()).toBe(false);
    setAnalyticsConsent(true);
    trackListingSaved("classified", "created");

    expect(gtag).not.toHaveBeenCalled();
  });

  it("sends only typed, non-personal event parameters", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    const gtag = vi.fn();
    vi.stubGlobal("window", {
      gtag,
      location: {
        href: "https://www.2424.mg/petites-annonces",
        pathname: "/petites-annonces",
        search: "",
      },
    });
    vi.stubGlobal("document", { title: "Petites annonces" });
    setAnalyticsConsent(true);

    trackPageView();
    trackContactInitiated("classified", "message");
    trackListingSaved("classified", "created");

    expect(gtag).toHaveBeenNthCalledWith(1, "event", "page_view", {
      page_location: "https://www.2424.mg/petites-annonces",
      page_path: "/petites-annonces",
      page_title: "Petites annonces",
    });
    expect(gtag).toHaveBeenNthCalledWith(2, "event", "contact_initiated", {
      content_type: "classified",
      contact_channel: "message",
    });
    expect(gtag).toHaveBeenNthCalledWith(3, "event", "listing_saved", {
      content_type: "classified",
      outcome: "created",
    });
  });

  it("stops emitting events after consent is withdrawn", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    setAnalyticsConsent(false);
    trackListingSaved("job", "created");

    expect(gtag).not.toHaveBeenCalled();
  });

  it("absorbs a failing Google script without affecting the caller", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    vi.stubGlobal("window", { gtag: vi.fn(() => { throw new Error("blocked"); }) });
    setAnalyticsConsent(true);

    expect(() => trackListingSaved("tender", "created")).not.toThrow();
  });
});
