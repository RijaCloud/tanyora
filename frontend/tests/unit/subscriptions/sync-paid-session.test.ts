import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppSessionUser } from "@/lib/auth/session";
import { syncPaidSession } from "@/features/subscriptions/lib/sync-paid-session";

const user = (planId: "free" | "essentiel" | "business") => ({ planId }) as AppSessionUser;

afterEach(() => vi.useRealTimers());

describe("syncPaidSession", () => {
  it("accepts a server-confirmed paid session immediately", async () => {
    const refresh = vi.fn().mockResolvedValue(user("business"));
    await expect(syncPaidSession(refresh, "business")).resolves.toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("retries stale and failed session refreshes in the background", async () => {
    vi.useFakeTimers();
    const refresh = vi.fn()
      .mockResolvedValueOnce(user("free"))
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValueOnce(user("essentiel"));
    const result = syncPaidSession(refresh, "essentiel");
    await vi.runAllTimersAsync();
    await expect(result).resolves.toBe(true);
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it("does not treat a different or missing plan as activated", async () => {
    vi.useFakeTimers();
    const refresh = vi.fn().mockResolvedValue(user("free"));
    const result = syncPaidSession(refresh, "business");
    await vi.runAllTimersAsync();
    await expect(result).resolves.toBe(false);
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it("stops if the user is no longer authenticated", async () => {
    const refresh = vi.fn().mockResolvedValue(null);
    await expect(syncPaidSession(refresh, "business")).resolves.toBe(false);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
