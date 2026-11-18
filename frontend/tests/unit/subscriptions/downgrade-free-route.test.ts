import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const setSessionCookieMock = vi.fn();
const isOnboardingRequiredMock = vi.fn();
const getCurrentSubscriptionMock = vi.fn();
const downgradeWordPressSubscriptionToFreeMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getServerSession: getServerSessionMock,
  setSessionCookie: setSessionCookieMock,
}));
vi.mock("@/lib/auth/flow", () => ({ isOnboardingRequired: isOnboardingRequiredMock }));
vi.mock("@/lib/billing/subscription-provider", () => ({
  subscriptionProvider: { getCurrentSubscription: getCurrentSubscriptionMock },
}));
vi.mock("@/lib/api/wordpress-internal", () => ({
  downgradeWordPressSubscriptionToFree: downgradeWordPressSubscriptionToFreeMock,
}));

async function loadRoute() {
  const module = await import("@/app/api/billing/subscription/downgrade-free/route");
  return module.POST;
}

describe("downgrade to free route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getServerSessionMock.mockReturnValue({ wpUserId: 42 });
    isOnboardingRequiredMock.mockReturnValue(false);
    getCurrentSubscriptionMock.mockResolvedValue({ planId: "free", status: "none" });
    downgradeWordPressSubscriptionToFreeMock.mockResolvedValue({ cancelledSubscriptionIds: [123] });
  });

  it("downgrades through the generic WordPress entitlement service", async () => {
    const POST = await loadRoute();
    const response = await POST();

    expect(response.status).toBe(200);
    expect(downgradeWordPressSubscriptionToFreeMock).toHaveBeenCalledWith({
      wpUserId: 42,
      reason: "self-service-downgrade-free",
    });
    expect(setSessionCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ planId: "free", subscriptionStatus: "none" }),
    );
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      planId: "free",
      status: "none",
      cancelledSubscriptionIds: [123],
    });
  });
});
