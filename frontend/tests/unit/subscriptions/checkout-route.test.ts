import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const isOnboardingRequiredMock = vi.fn();
const isEmailVerificationRequiredMock = vi.fn();
const getWordPressSubscriptionPricingConfigMock = vi.fn();
const startPapiPaymentInWordPressMock = vi.fn();
const getCurrentSubscriptionMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/auth/flow", () => ({ isOnboardingRequired: isOnboardingRequiredMock }));
vi.mock("@/lib/auth/email-verification", () => ({
  isEmailVerificationRequired: isEmailVerificationRequiredMock,
}));
vi.mock("@/lib/api/wordpress-internal", () => ({
  getWordPressSubscriptionPricingConfig: getWordPressSubscriptionPricingConfigMock,
  startPapiPaymentInWordPress: startPapiPaymentInWordPressMock,
  getWooCommerceSubscriptionSnapshot: getCurrentSubscriptionMock,
  getWordPressRequestStatus: () => undefined,
}));

async function loadRoute() {
  return (await import("@/app/api/billing/checkout/route")).POST;
}

function request(body: unknown) {
  return new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("subscription checkout route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getServerSessionMock.mockReturnValue({
      wpUserId: 42,
      email: "business@example.com",
      name: "Business User",
    });
    isOnboardingRequiredMock.mockReturnValue(false);
    isEmailVerificationRequiredMock.mockReturnValue(false);
    getWordPressSubscriptionPricingConfigMock.mockResolvedValue({
      plans: {
        essentiel: { monthlyPriceAr: 18000, annual: { available: true } },
        business: { monthlyPriceAr: 90000, annual: { available: true } },
      },
    });
    getCurrentSubscriptionMock.mockResolvedValue({ planId: "free", status: "none" });
    startPapiPaymentInWordPressMock.mockResolvedValue({
      checkoutUrl: "https://papi.example/checkout",
      orderId: 123,
      orderKey: "order-key",
    });
  });

  it("rejects unauthenticated users", async () => {
    getServerSessionMock.mockReturnValue(null);
    const response = await (await loadRoute())(request({ planId: "essentiel" }));
    expect(response.status).toBe(401);
  });

  it("rejects an unavailable annual plan", async () => {
    getWordPressSubscriptionPricingConfigMock.mockResolvedValue({
      plans: { essentiel: { annual: { available: false } } },
    });
    const response = await (await loadRoute())(
      request({ planId: "essentiel", billingPeriod: "annual" }),
    );
    expect(response.status).toBe(400);
  });

  it("starts a direct PAPI payment backed by a WooCommerce order", async () => {
    const response = await (await loadRoute())(
      request({ planId: "business", billingPeriod: "monthly" }),
    );

    expect(response.status).toBe(200);
    expect(startPapiPaymentInWordPressMock).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: "subscription",
        planId: "business",
        billingPeriod: "monthly",
        wpUserId: 42,
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      checkoutUrl: "https://papi.example/checkout",
      orderId: 123,
    });
  });

  it("returns the server-confirmed zero-price activation without a payment link", async () => {
    startPapiPaymentInWordPressMock.mockResolvedValue({ activated: true, planId: "business" });
    const response = await (await loadRoute())(request({ planId: "business", billingPeriod: "annual", expectedZeroPrice: true }));
    expect(response.status).toBe(200);
    expect(startPapiPaymentInWordPressMock).toHaveBeenCalledWith(expect.objectContaining({ expectedZeroPrice: true }));
    await expect(response.json()).resolves.toEqual({ activated: true, planId: "business" });
  });

  it("rejects an activation response for another plan", async () => {
    startPapiPaymentInWordPressMock.mockResolvedValue({ activated: true, planId: "essentiel" });
    const response = await (await loadRoute())(request({ planId: "business" }));
    expect(response.status).toBe(502);
  });
});
