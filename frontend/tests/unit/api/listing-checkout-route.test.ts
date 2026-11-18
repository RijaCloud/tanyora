import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const isOnboardingRequiredMock = vi.fn();
const isEmailVerificationRequiredMock = vi.fn();
const getWordPressListingPayableQuoteMock = vi.fn();
const getWordPressPublishingAccessStatusMock = vi.fn();
const getWordPressRequestStatusMock = vi.fn();
const startPapiPaymentInWordPressMock = vi.fn();
const useWordPressAllPrivilegesListingAccessMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/auth/flow", () => ({ isOnboardingRequired: isOnboardingRequiredMock }));
vi.mock("@/lib/auth/email-verification", () => ({
  isEmailVerificationRequired: isEmailVerificationRequiredMock,
}));
vi.mock("@/lib/api/wordpress-internal", () => ({
  getWordPressListingPayableQuote: getWordPressListingPayableQuoteMock,
  getWordPressPublishingAccessStatus: getWordPressPublishingAccessStatusMock,
  getWordPressRequestStatus: getWordPressRequestStatusMock,
  startPapiPaymentInWordPress: startPapiPaymentInWordPressMock,
  useWordPressAllPrivilegesListingAccess: useWordPressAllPrivilegesListingAccessMock,
}));

async function loadRoute() {
  return (await import("@/app/api/billing/checkout/listing/route")).POST;
}

function request(body: unknown) {
  return new Request("http://localhost/api/billing/checkout/listing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("listing checkout route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getServerSessionMock.mockReturnValue({ wpUserId: 42 });
    isOnboardingRequiredMock.mockReturnValue(false);
    isEmailVerificationRequiredMock.mockReturnValue(false);
    getWordPressPublishingAccessStatusMock.mockResolvedValue({
      classifieds: { canPublish: true },
      jobs: { canPublish: true },
      tenders: { canPublish: true },
    });
    getWordPressListingPayableQuoteMock.mockResolvedValue({
      listingId: 55,
      kind: "classified",
      pricingCode: "classified_boost_7d",
    });
    startPapiPaymentInWordPressMock.mockResolvedValue({
      checkoutUrl: "https://payment-form.papi.mg/checkout",
      orderId: 123,
      orderKey: "order-key",
    });
  });

  it("starts a direct PAPI checkout for a listing", async () => {
    const response = await (await loadRoute())(request({ listingId: 55, action: "boost" }));

    expect(response.status).toBe(200);
    expect(startPapiPaymentInWordPressMock).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: "listing",
        listingId: 55,
        action: "boost",
        returnTarget: "classifieds",
      }),
    );
  });

  it("preserves a safe WordPress validation status", async () => {
    const error = Object.assign(new Error("Le lien de paiement n'a pas pu être créé."), { status: 422 });
    startPapiPaymentInWordPressMock.mockRejectedValue(error);
    getWordPressRequestStatusMock.mockReturnValue(422);

    const response = await (await loadRoute())(request({ listingId: 55, action: "boost" }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ error: "Le lien de paiement n'a pas pu être créé." });
  });

  it("activates a privileged listing without creating a PAPI checkout", async () => {
    getWordPressPublishingAccessStatusMock.mockResolvedValue({
      classifieds: { canPublish: true },
      jobs: { canPublish: true },
      tenders: { canPublish: true },
      accessGrant: "all_privileges",
    });
    useWordPressAllPrivilegesListingAccessMock.mockResolvedValue({
      listingId: 55,
      action: "boost",
      paymentStatus: "paid",
      postStatus: "publish",
      accessGrant: "all_privileges",
      alreadyProcessed: false,
    });

    const response = await (await loadRoute())(request({ listingId: 55, action: "boost", requestId: "grant-request-1" }));

    expect(response.status).toBe(200);
    expect(useWordPressAllPrivilegesListingAccessMock).toHaveBeenCalledWith(expect.objectContaining({
      wpUserId: 42,
      listingId: 55,
      action: "boost",
      requestId: "grant-request-1",
    }));
    expect(startPapiPaymentInWordPressMock).not.toHaveBeenCalled();
  });

  it("uses a gateway status when no WordPress response exists", async () => {
    startPapiPaymentInWordPressMock.mockRejectedValue(new Error("Impossible de joindre le service de paiement."));
    getWordPressRequestStatusMock.mockReturnValue(null);

    const response = await (await loadRoute())(request({ listingId: 55 }));

    expect(response.status).toBe(502);
  });
});
