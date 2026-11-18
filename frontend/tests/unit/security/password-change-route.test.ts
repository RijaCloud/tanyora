import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const changeWordPressPasswordMock = vi.fn();
const consumeRateLimitMock = vi.fn();
const getClientIpMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/api/wordpress-internal", () => ({ changeWordPressPassword: changeWordPressPasswordMock }));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
  getClientIp: getClientIpMock,
}));

async function loadRoute() {
  const module = await import("@/app/api/auth/password/change/route");
  return module.POST;
}

function createRequest(body: Record<string, string>) {
  return new Request("http://localhost/api/auth/password/change", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("password change route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getServerSessionMock.mockReturnValue({ wpUserId: 42, authProvider: "local" });
    getClientIpMock.mockReturnValue("127.0.0.1");
    consumeRateLimitMock.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    changeWordPressPasswordMock.mockResolvedValue({ ok: true, message: "Votre mot de passe a été mis à jour." });
  });

  it("rejects unauthenticated requests", async () => {
    getServerSessionMock.mockReturnValue(null);
    const POST = await loadRoute();

    const response = await POST(createRequest({ currentPassword: "OldPass1!", newPassword: "NewPass1!" }) as never);

    expect(response.status).toBe(401);
    expect(changeWordPressPasswordMock).not.toHaveBeenCalled();
  });

  it("does not expose a local password change to Google sessions", async () => {
    getServerSessionMock.mockReturnValue({ wpUserId: 42, authProvider: "google" });
    const POST = await loadRoute();

    const response = await POST(createRequest({ currentPassword: "OldPass1!", newPassword: "NewPass1!" }) as never);

    expect(response.status).toBe(403);
    expect(changeWordPressPasswordMock).not.toHaveBeenCalled();
  });

  it("rejects passwords that do not meet the shared policy", async () => {
    const POST = await loadRoute();

    const response = await POST(createRequest({ currentPassword: "OldPass1!", newPassword: "Short1!" }) as never);

    expect(response.status).toBe(400);
    expect(changeWordPressPasswordMock).not.toHaveBeenCalled();
  });

  it("forwards a valid authenticated password change without logging secrets", async () => {
    const POST = await loadRoute();

    const response = await POST(createRequest({ currentPassword: "OldPass1!", newPassword: "NewPass1!" }) as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(changeWordPressPasswordMock).toHaveBeenCalledWith({
      wpUserId: 42,
      currentPassword: "OldPass1!",
      newPassword: "NewPass1!",
    });
  });

  it("returns a retry response when the change limit is reached", async () => {
    consumeRateLimitMock.mockResolvedValue({ allowed: false, retryAfterSeconds: 900 });
    const POST = await loadRoute();

    const response = await POST(createRequest({ currentPassword: "OldPass1!", newPassword: "NewPass1!" }) as never);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("900");
    expect(changeWordPressPasswordMock).not.toHaveBeenCalled();
  });
});
