import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const setSessionCookieMock = vi.fn();
const isOnboardingRequiredMock = vi.fn();
const isEmailVerificationRequiredMock = vi.fn();
const getWordPressSubscriptionPricingConfigMock = vi.fn();
const activateWordPressStagingSubscriptionBypassMock = vi.fn();
const getCurrentSubscriptionMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getServerSession: getServerSessionMock,
  setSessionCookie: setSessionCookieMock,
}));
vi.mock("@/lib/auth/flow", () => ({ isOnboardingRequired: isOnboardingRequiredMock }));
vi.mock("@/lib/auth/email-verification", () => ({ isEmailVerificationRequired: isEmailVerificationRequiredMock }));
vi.mock("@/lib/api/wordpress-internal", () => ({
  getWordPressSubscriptionPricingConfig: getWordPressSubscriptionPricingConfigMock,
  activateWordPressStagingSubscriptionBypass: activateWordPressStagingSubscriptionBypassMock,
}));
vi.mock("@/lib/billing/subscription-provider", () => ({
  subscriptionProvider: { getCurrentSubscription: getCurrentSubscriptionMock },
}));

async function loadRoute() {
  return (await import("@/app/api/billing/subscription/staging-bypass/route")).POST;
}

function request(body: unknown) {
  return new Request("http://localhost/api/billing/subscription/staging-bypass", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("staging subscription bypass route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getServerSessionMock.mockReturnValue({ wpUserId: 42, email: "test@example.com", name: "Test" });
    isOnboardingRequiredMock.mockReturnValue(false);
    isEmailVerificationRequiredMock.mockReturnValue(false);
    getWordPressSubscriptionPricingConfigMock.mockResolvedValue({
      stagingBypassAvailable: true,
      plans: { essentiel: { annual: { available: true } }, business: { annual: { available: true } } },
    });
    getCurrentSubscriptionMock.mockResolvedValue({ planId: "free", status: "none" });
    activateWordPressStagingSubscriptionBypassMock.mockResolvedValue({
      ok: true, planId: "business", billingPeriod: "annual", startedAt: "2026-10-02T00:00:00Z", renewsAt: "2027-10-02T00:00:00Z",
    });
  });

  it("does not expose activation when the plugin setting is disabled", async () => {
    getWordPressSubscriptionPricingConfigMock.mockResolvedValue({ stagingBypassAvailable: false, plans: {} });
    const response = await (await loadRoute())(request({ planId: "essentiel" }));
    expect(response.status).toBe(403);
    expect(activateWordPressStagingSubscriptionBypassMock).not.toHaveBeenCalled();
  });

  it("activates the requested subscription without a checkout", async () => {
    const response = await (await loadRoute())(request({ planId: "business", billingPeriod: "annual" }));
    expect(response.status).toBe(200);
    expect(activateWordPressStagingSubscriptionBypassMock).toHaveBeenCalledWith({ wpUserId: 42, planId: "business", billingPeriod: "annual" });
    expect(setSessionCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ planId: "business", subscriptionStatus: "active" }),
    );
    await expect(response.json()).resolves.toMatchObject({ ok: true, renewsAt: "2027-10-02T00:00:00Z" });
  });
});
