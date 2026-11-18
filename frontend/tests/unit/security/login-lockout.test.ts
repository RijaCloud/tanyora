import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheState = new Map<string, { value: number; expiresAt: number | null }>();

const cacheStoreMock = {
  async get<T>(key: string): Promise<T | null> {
    const entry = cacheState.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      cacheState.delete(key);
      return null;
    }

    return entry.value as T;
  },
  async set(key: string, value: number, ttlSeconds?: number) {
    cacheState.set(key, {
      value,
      expiresAt: typeof ttlSeconds === "number" ? Date.now() + ttlSeconds * 1000 : null,
    });
  },
  async delete(key: string) {
    cacheState.delete(key);
  },
  async increment(key: string, ttlSeconds?: number) {
    const current = await this.get<number>(key);
    const nextValue = (current ?? 0) + 1;
    await this.set(key, nextValue, ttlSeconds);
    return nextValue;
  },
};

vi.mock("@/lib/cache", () => ({
  cacheStore: cacheStoreMock,
}));

describe("login lockout", () => {
  beforeEach(() => {
    cacheState.clear();
    vi.useRealTimers();
    vi.resetModules();
  });

  it("exposes the expected lockout policy", async () => {
    const { getLoginLockoutPolicy } = await import("@/lib/security/login-lockout");

    expect(getLoginLockoutPolicy()).toEqual({
      threshold: 5,
      durationSeconds: 1800,
      resetSeconds: 3600,
    });
  });

  it("locks the identifier after five failed attempts", async () => {
    const { recordFailedLoginAttempt } = await import("@/lib/security/login-lockout");

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const result = await recordFailedLoginAttempt("User@example.com");
      expect(result).toMatchObject({
        locked: false,
        attempts: attempt,
        attemptsRemaining: 5 - attempt,
      });
    }

    const finalResult = await recordFailedLoginAttempt("User@example.com");

    expect(finalResult).toMatchObject({
      locked: true,
      attempts: 5,
      attemptsRemaining: 0,
      retryAfterSeconds: 1800,
    });
  });

  it("returns a lockout status while the lock is still active", async () => {
    const { getLoginLockout, recordFailedLoginAttempt } = await import("@/lib/security/login-lockout");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await recordFailedLoginAttempt("locked@example.com");
    }

    const lockout = await getLoginLockout("locked@example.com");

    expect(lockout).not.toBeNull();
    expect(lockout?.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("clears expired lockouts automatically", async () => {
    vi.useFakeTimers();
    const { getLoginLockout, recordFailedLoginAttempt } = await import("@/lib/security/login-lockout");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await recordFailedLoginAttempt("expire@example.com");
    }

    vi.advanceTimersByTime(30 * 60 * 1000 + 1000);

    const lockout = await getLoginLockout("expire@example.com");

    expect(lockout).toBeNull();
  });

  it("clears attempts and lock state explicitly", async () => {
    const { clearLoginLockout, getLoginLockout, recordFailedLoginAttempt } = await import("@/lib/security/login-lockout");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await recordFailedLoginAttempt("clear@example.com");
    }

    await clearLoginLockout("clear@example.com");

    expect(await getLoginLockout("clear@example.com")).toBeNull();
  });
});
