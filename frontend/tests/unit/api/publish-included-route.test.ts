import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const isOnboardingRequiredMock = vi.fn();
const isEmailVerificationRequiredMock = vi.fn();
const getWordPressPublishingAccessStatusMock = vi.fn();
const useWordPressIncludedListingAccessMock = vi.fn();
const refreshPublicListingDataMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/auth/flow", () => ({
  isOnboardingRequired: isOnboardingRequiredMock,
}));

vi.mock("@/lib/auth/email-verification", () => ({
  isEmailVerificationRequired: isEmailVerificationRequiredMock,
}));

vi.mock("@/lib/api/wordpress-internal", () => ({
  getWordPressPublishingAccessStatus: getWordPressPublishingAccessStatusMock,
  useWordPressIncludedListingAccess: useWordPressIncludedListingAccessMock,
}));

vi.mock("@/lib/api/listing-mutation", () => ({
  refreshPublicListingData: refreshPublicListingDataMock,
}));

async function loadRoute() {
  const module = await import("@/app/api/submissions/listing/publish-included/route");
  return module.POST;
}

function createRequest(body: unknown) {
  return new Request("http://localhost/api/submissions/listing/publish-included", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("publish included listing route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getServerSessionMock.mockReturnValue({
      wpUserId: 42,
      email: "user@example.com",
    });
    isOnboardingRequiredMock.mockReturnValue(false);
    isEmailVerificationRequiredMock.mockReturnValue(false);
    useWordPressIncludedListingAccessMock.mockResolvedValue({
      listingId: 99,
      paymentStatus: "paid",
      usedIncludedAccess: true,
    });
  });

  it("blocks included publication when monthly included quota is exhausted", async () => {
    getWordPressPublishingAccessStatusMock.mockResolvedValue({
      classifieds: {
        canPublish: true,
        monthlyRemaining: 0,
      },
      jobs: {
        canPublish: true,
        monthlyRemaining: 3,
      },
    });
    const POST = await loadRoute();

    const response = await POST(createRequest({ listingId: 99, kind: "classified" }) as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Votre quota mensuel inclus est déjà atteint.",
    });
  });

  it("publishes through included access when quota remains", async () => {
    getWordPressPublishingAccessStatusMock.mockResolvedValue({
      classifieds: {
        canPublish: true,
        monthlyRemaining: 1,
      },
      jobs: {
        canPublish: false,
        monthlyRemaining: 0,
      },
    });
    const POST = await loadRoute();

    const response = await POST(createRequest({ listingId: 99, kind: "classified" }) as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      listingId: 99,
      usedIncludedAccess: true,
    });
    expect(useWordPressIncludedListingAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wpUserId: 42,
        listingId: 99,
      }),
    );
    expect(refreshPublicListingDataMock).toHaveBeenCalledWith("classified");
  });

  it("publishes a tender through its Business included quota", async () => {
    getWordPressPublishingAccessStatusMock.mockResolvedValue({
      classifieds: {
        canPublish: true,
        monthlyRemaining: 1,
      },
      jobs: {
        canPublish: false,
        monthlyRemaining: 0,
      },
      tenders: {
        canPublish: true,
        monthlyRemaining: 10,
      },
    });
    const POST = await loadRoute();

    const response = await POST(createRequest({ listingId: 99, kind: "tender" }) as never);

    expect(response.status).toBe(200);
    expect(useWordPressIncludedListingAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wpUserId: 42,
        listingId: 99,
      }),
    );
    expect(refreshPublicListingDataMock).toHaveBeenCalledWith("tender");
  });
});
