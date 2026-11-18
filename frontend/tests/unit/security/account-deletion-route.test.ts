import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const clearSessionCookieMock = vi.fn();
const deleteWordPressAccountMock = vi.fn();
const requestWordPressAccountDeletionCodeMock = vi.fn();
const consumeRateLimitMock = vi.fn();
const getClientIpMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getServerSession: getServerSessionMock,
  clearSessionCookie: clearSessionCookieMock,
}));
vi.mock("@/lib/api/wordpress-internal", () => ({
  deleteWordPressAccount: deleteWordPressAccountMock,
  requestWordPressAccountDeletionCode: requestWordPressAccountDeletionCodeMock,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
  getClientIp: getClientIpMock,
}));

async function loadRoutes() {
  const deletion = await import("@/app/api/auth/account-deletion/route");
  const code = await import("@/app/api/auth/account-deletion/request-code/route");
  return { deleteAccount: deletion.POST, requestCode: code.POST };
}

function request(body: Record<string, string>) {
  return new Request("http://localhost/api/auth/account-deletion", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("account deletion routes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getServerSessionMock.mockReturnValue({ wpUserId: 42, authProvider: "local" });
    consumeRateLimitMock.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    getClientIpMock.mockReturnValue("127.0.0.1");
    deleteWordPressAccountMock.mockResolvedValue({ ok: true });
    requestWordPressAccountDeletionCodeMock.mockResolvedValue({ ok: true, challengeId: "challenge", expiresInSeconds: 900, email: "r***@example.com" });
  });

  it("rejects requests without a connected user", async () => {
    getServerSessionMock.mockReturnValue(null);
    const { deleteAccount } = await loadRoutes();

    const response = await deleteAccount(request({ confirmation: "SUPPRIMER", currentPassword: "secret" }) as never);

    expect(response.status).toBe(401);
    expect(deleteWordPressAccountMock).not.toHaveBeenCalled();
  });

  it("requires the exact deletion confirmation and password for local accounts", async () => {
    const { deleteAccount } = await loadRoutes();

    const response = await deleteAccount(request({ confirmation: "supprimer" }) as never);

    expect(response.status).toBe(400);
    expect(deleteWordPressAccountMock).not.toHaveBeenCalled();
  });

  it("uses the signed session identity and clears it only after a successful deletion", async () => {
    const { deleteAccount } = await loadRoutes();

    const response = await deleteAccount(request({ confirmation: "SUPPRIMER", currentPassword: "secret" }) as never);

    expect(response.status).toBe(200);
    expect(deleteWordPressAccountMock).toHaveBeenCalledWith({
      wpUserId: 42,
      confirmation: "SUPPRIMER",
      currentPassword: "secret",
      challengeId: undefined,
      verificationCode: undefined,
    });
    expect(clearSessionCookieMock).toHaveBeenCalledTimes(1);
  });

  it("requires a one-time email code for Google accounts", async () => {
    getServerSessionMock.mockReturnValue({ wpUserId: 42, authProvider: "google" });
    const { deleteAccount, requestCode } = await loadRoutes();

    const missingCodeResponse = await deleteAccount(request({ confirmation: "SUPPRIMER" }) as never);
    expect(missingCodeResponse.status).toBe(400);
    expect(deleteWordPressAccountMock).not.toHaveBeenCalled();

    const codeResponse = await requestCode();
    expect(codeResponse.status).toBe(200);
    expect(requestWordPressAccountDeletionCodeMock).toHaveBeenCalledWith({ wpUserId: 42 });
  });

  it("keeps the session intact when WordPress blocks deletion", async () => {
    deleteWordPressAccountMock.mockRejectedValue(new Error("Résiliez votre abonnement payant avant de supprimer votre compte."));
    const { deleteAccount } = await loadRoutes();

    const response = await deleteAccount(request({ confirmation: "SUPPRIMER", currentPassword: "secret" }) as never);

    expect(response.status).toBe(400);
    expect(clearSessionCookieMock).not.toHaveBeenCalled();
  });
});
