import { beforeEach, describe, expect, it, vi } from "vitest";

const getWordPressWebPushConfigMock = vi.fn();

vi.mock("@/lib/api/wordpress-internal", () => ({
  getWordPressWebPushConfig: getWordPressWebPushConfigMock,
}));

describe("web push configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("exposes only the public key to browser-facing callers", async () => {
    getWordPressWebPushConfigMock.mockResolvedValue({
      configured: true,
      publicKey: "public-vapid-key",
      privateKey: "private-vapid-key",
      subject: "mailto:contact@2424.mg",
    });
    const { getPublicPushConfig } = await import("@/lib/notifications/push");

    await expect(getPublicPushConfig()).resolves.toEqual({
      configured: true,
      publicKey: "public-vapid-key",
    });
  });

  it("disables push when WordPress has no complete VAPID configuration", async () => {
    getWordPressWebPushConfigMock.mockResolvedValue({
      configured: false,
      publicKey: "",
      privateKey: "",
      subject: "",
    });
    const { getPublicPushConfig } = await import("@/lib/notifications/push");

    await expect(getPublicPushConfig()).resolves.toEqual({
      configured: false,
      publicKey: null,
    });
  });
});
