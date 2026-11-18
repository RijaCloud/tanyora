import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLOSED_COMMERCE_CAPABILITIES,
  loadCommerceCapabilities,
  normalizeCommerceCapabilities,
} from "@/lib/commerce/capabilities";

const previousBase = process.env.WORDPRESS_INTERNAL_API_BASE_URL;
const previousSecret = process.env.PLATFORM_SUBMISSIONS_SECRET;

afterEach(() => {
  if (previousBase === undefined) delete process.env.WORDPRESS_INTERNAL_API_BASE_URL;
  else process.env.WORDPRESS_INTERNAL_API_BASE_URL = previousBase;
  if (previousSecret === undefined) delete process.env.PLATFORM_SUBMISSIONS_SECRET;
  else process.env.PLATFORM_SUBMISSIONS_SECRET = previousSecret;
  vi.unstubAllGlobals();
});

describe("commerce capabilities", () => {
  it("remains closed without internal configuration", async () => {
    delete process.env.WORDPRESS_INTERNAL_API_BASE_URL;
    delete process.env.PLATFORM_SUBMISSIONS_SECRET;
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    expect(await loadCommerceCapabilities()).toEqual(CLOSED_COMMERCE_CAPABILITIES);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("does not trust incomplete or inconsistent upstream capabilities", () => {
    expect(normalizeCommerceCapabilities({ quotes: true, orders: true, onlinePayments: true }))
      .toEqual(CLOSED_COMMERCE_CAPABILITIES);
    expect(normalizeCommerceCapabilities({
      schemaReady: true,
      sellerVerification: true,
      buyerVerification: false,
      quotes: true,
      orders: true,
    })).toMatchObject({ quotes: false, orders: false, onlinePayments: false });
  });

  it("fails closed when WordPress is unavailable", async () => {
    process.env.WORDPRESS_INTERNAL_API_BASE_URL = "http://wordpress/index.php?rest_route=/2424/v1";
    process.env.PLATFORM_SUBMISSIONS_SECRET = "test-only";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(await loadCommerceCapabilities()).toEqual(CLOSED_COMMERCE_CAPABILITIES);
  });

  it("loads the internal endpoint without enabling payments", async () => {
    process.env.WORDPRESS_INTERNAL_API_BASE_URL = "http://wordpress/index.php?rest_route=/2424/v1";
    process.env.PLATFORM_SUBMISSIONS_SECRET = "test-only";
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaReady: true,
        sellerVerification: true,
        buyerVerification: true,
        quotes: true,
        orders: true,
        onlinePayments: true,
      }),
    });
    vi.stubGlobal("fetch", fetcher);

    expect(await loadCommerceCapabilities()).toMatchObject({ quotes: true, orders: true, onlinePayments: false });
    expect(fetcher).toHaveBeenCalledWith(
      "http://wordpress/index.php?rest_route=/2424/v1/tanyora/commerce/capabilities",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
  });
});
