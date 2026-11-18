import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const createPendingOrganizationMock = vi.fn();
const listMemberOrganizationsMock = vi.fn();
const consumeRateLimitMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/commerce/organizations", () => ({
  createPendingOrganization: createPendingOrganizationMock,
  listMemberOrganizations: listMemberOrganizationsMock,
}));
vi.mock("@/lib/security/rate-limit", () => ({ consumeRateLimit: consumeRateLimitMock }));

const requestKey = "123e4567-e89b-42d3-a456-426614174000";

function organizationRequest(key = requestKey, body: unknown = { name: "Cabinet Test", countryCode: "MG" }) {
  return new Request("http://localhost/api/commerce/organizations", {
    method: "POST",
    headers: { "content-type": "application/json", "x-idempotency-key": key },
    body: JSON.stringify(body),
  });
}

async function route() {
  return import("@/app/api/commerce/organizations/route");
}

describe("commerce organization route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getServerSessionMock.mockReturnValue({ wpUserId: 42, onboardingCompleted: true, emailVerified: true });
    consumeRateLimitMock.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    createPendingOrganizationMock.mockResolvedValue({ id: 8, name: "Cabinet Test", countryCode: "MG", status: "pending" });
    listMemberOrganizationsMock.mockResolvedValue([]);
  });

  it("rejects anonymous and incomplete accounts before touching WordPress", async () => {
    const { GET, POST } = await route();
    getServerSessionMock.mockReturnValue(null);
    expect((await GET()).status).toBe(401);
    expect((await POST(organizationRequest() as never)).status).toBe(401);
    getServerSessionMock.mockReturnValue({ wpUserId: 42, onboardingCompleted: false });
    expect((await POST(organizationRequest() as never)).status).toBe(401);
    expect(createPendingOrganizationMock).not.toHaveBeenCalled();
  });

  it("requires a stable idempotency key and valid organization data", async () => {
    const { POST } = await route();
    expect((await POST(organizationRequest("bad") as never)).status).toBe(400);
    expect((await POST(organizationRequest(requestKey, { name: "", countryCode: "MG" }) as never)).status).toBe(400);
    expect(createPendingOrganizationMock).not.toHaveBeenCalled();
  });

  it("uses the session user id, not a browser-supplied identity", async () => {
    const { POST } = await route();
    const response = await POST(organizationRequest(requestKey, {
      name: "Cabinet Test", countryCode: "mg", wpUserId: 999,
    }) as never);
    expect(response.status).toBe(400);

    const valid = await POST(organizationRequest(requestKey, { name: "Cabinet Test", countryCode: "mg" }) as never);
    expect(valid.status).toBe(201);
    expect(valid.headers.get("Cache-Control")).toBe("private, no-store");
    expect(createPendingOrganizationMock).toHaveBeenCalledWith({
      wpUserId: 42, name: "Cabinet Test", countryCode: "MG", requestKey,
    });
  });

  it("lists only organizations for the signed-in user", async () => {
    const { GET } = await route();
    const response = await GET();
    expect(response.status).toBe(200);
    expect(listMemberOrganizationsMock).toHaveBeenCalledWith(42);
  });

  it("fails closed on upstream outage and rate limiting", async () => {
    const { POST } = await route();
    consumeRateLimitMock.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 60 });
    expect((await POST(organizationRequest() as never)).status).toBe(429);
    createPendingOrganizationMock.mockRejectedValueOnce(new Error("offline"));
    expect((await POST(organizationRequest() as never)).status).toBe(503);
  });
});
