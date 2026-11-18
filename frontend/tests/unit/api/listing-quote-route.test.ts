import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const getWordPressPublishingAccessStatusMock = vi.fn();
const getWordPressListingPayableQuoteMock = vi.fn();
const getWordPressPricingCatalogMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/api/wordpress-internal", () => ({
  getWordPressPublishingAccessStatus: getWordPressPublishingAccessStatusMock,
  getWordPressListingPayableQuote: getWordPressListingPayableQuoteMock,
  getWordPressPricingCatalog: getWordPressPricingCatalogMock,
}));

async function loadRoute() {
  const module = await import("@/app/api/billing/listing/quote/route");
  return module.POST;
}

function createRequest(body: unknown) {
  return new Request("http://localhost/api/billing/listing/quote", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("listing quote route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getServerSessionMock.mockReturnValue({
      wpUserId: 42,
    });

    getWordPressPublishingAccessStatusMock.mockResolvedValue({
      planId: "free",
      classifieds: {
        canCreateDraft: true,
        canPublish: true,
        monthlyLimit: 1,
        monthlyUsed: 1,
        monthlyRemaining: 0,
        maxPhotos: 2,
      },
      jobs: {
        canCreateDraft: false,
        canPublish: false,
        monthlyLimit: 0,
        monthlyUsed: 0,
        monthlyRemaining: 0,
      },
      period: {
        monthKey: "2026-06",
        resetsAt: "2026-07-01T00:00:00Z",
      },
    });

    getWordPressListingPayableQuoteMock.mockResolvedValue({
      listingId: 99,
      kind: "classified",
      pricingCode: "classified_single",
    });

    getWordPressPricingCatalogMock.mockResolvedValue({
      items: [
        {
          code: "classified_single",
          kind: "classified",
          action: "post",
          variant: "",
          price: 2500,
        },
      ],
    });
  });

  it("allows paid quote fallback when included quota is exhausted", async () => {
    const POST = await loadRoute();

    const response = await POST(createRequest({ listingId: 99, action: "post" }) as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      quote: {
        listingId: 99,
        kind: "classified",
      },
      pricing: {
        code: "classified_single",
      },
    });
  });

  it("identifies a privileged account without changing the quote", async () => {
    getWordPressPublishingAccessStatusMock.mockResolvedValue({
      planId: "business",
      accessGrant: "all_privileges",
      classifieds: { canPublish: true },
      jobs: { canPublish: true },
      tenders: { canPublish: true },
    });
    const POST = await loadRoute();

    const response = await POST(createRequest({ listingId: 99, action: "post" }) as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ allPrivileges: true });
  });

  it("blocks quote when plan cannot publish the requested listing kind", async () => {
    getWordPressListingPayableQuoteMock.mockResolvedValue({
      listingId: 100,
      kind: "job",
      pricingCode: "job_single",
    });
    const POST = await loadRoute();

    const response = await POST(createRequest({ listingId: 100, action: "post" }) as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Votre plan actuel ne permet pas de publier une offre d'emploi.",
    });
  });
});
