import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const isOnboardingRequiredMock = vi.fn();
const sendWordPressEmailVerificationMock = vi.fn();
const consumeRateLimitMock = vi.fn();
const getClientIpMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/auth/flow", () => ({ isOnboardingRequired: isOnboardingRequiredMock }));
vi.mock("@/lib/api/wordpress-internal", () => ({
  sendWordPressEmailVerification: sendWordPressEmailVerificationMock,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
  getClientIp: getClientIpMock,
}));

async function loadRoute() {
  const module = await import("@/app/api/auth/email-verification/resend/route");
  return module.POST;
}

describe("email verification resend route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getServerSessionMock.mockReturnValue({
      wpUserId: 42,
      email: "user@example.com",
      emailVerified: false,
      onboardingCompleted: true,
    });
    isOnboardingRequiredMock.mockReturnValue(false);
    getClientIpMock.mockReturnValue("127.0.0.1");
    consumeRateLimitMock.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    sendWordPressEmailVerificationMock.mockResolvedValue({ ok: true });
  });

  it("does not replace the verification link while onboarding is incomplete", async () => {
    isOnboardingRequiredMock.mockReturnValue(true);
    const POST = await loadRoute();

    const response = await POST(new Request("http://localhost/api/auth/email-verification/resend", { method: "POST" }) as never);

    expect(response.status).toBe(409);
    expect(consumeRateLimitMock).not.toHaveBeenCalled();
    expect(sendWordPressEmailVerificationMock).not.toHaveBeenCalled();
  });

  it("sends a replacement link once onboarding is complete", async () => {
    const POST = await loadRoute();

    const response = await POST(new Request("http://localhost/api/auth/email-verification/resend", { method: "POST" }) as never);

    expect(response.status).toBe(200);
    expect(sendWordPressEmailVerificationMock).toHaveBeenCalledWith({
      wpUserId: 42,
      email: "user@example.com",
    });
  });
});
