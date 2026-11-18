import { cacheStore } from "@/lib/cache";

const LOGIN_LOCKOUT_THRESHOLD = 5;
const LOGIN_LOCKOUT_DURATION_SECONDS = 30 * 60;
const LOGIN_LOCKOUT_RESET_SECONDS = 60 * 60;

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function attemptsKey(identifier: string) {
  return `auth:login:attempts:${normalizeIdentifier(identifier)}`;
}

function lockKey(identifier: string) {
  return `auth:login:lock:${normalizeIdentifier(identifier)}`;
}

export function getLoginLockoutPolicy() {
  return {
    threshold: LOGIN_LOCKOUT_THRESHOLD,
    durationSeconds: LOGIN_LOCKOUT_DURATION_SECONDS,
    resetSeconds: LOGIN_LOCKOUT_RESET_SECONDS,
  };
}

export async function getLoginLockout(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) {
    return null;
  }

  const lockedUntil = await cacheStore.get<number>(lockKey(normalized));
  if (!lockedUntil || !Number.isFinite(lockedUntil)) {
    return null;
  }

  const retryAfterSeconds = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
  if (retryAfterSeconds <= 0) {
    await cacheStore.delete(lockKey(normalized));
    return null;
  }

  return {
    retryAfterSeconds,
    lockedUntil,
  };
}

export async function recordFailedLoginAttempt(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) {
    return null;
  }

  const count = await cacheStore.increment(attemptsKey(normalized), LOGIN_LOCKOUT_RESET_SECONDS);
  if (count < LOGIN_LOCKOUT_THRESHOLD) {
    return {
      locked: false as const,
      attempts: count,
      attemptsRemaining: Math.max(0, LOGIN_LOCKOUT_THRESHOLD - count),
    };
  }

  const lockedUntil = Date.now() + LOGIN_LOCKOUT_DURATION_SECONDS * 1000;
  await cacheStore.set(lockKey(normalized), lockedUntil, LOGIN_LOCKOUT_DURATION_SECONDS);

  return {
    locked: true as const,
    attempts: count,
    attemptsRemaining: 0,
    retryAfterSeconds: LOGIN_LOCKOUT_DURATION_SECONDS,
    lockedUntil,
  };
}

export async function clearLoginLockout(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) {
    return;
  }

  await Promise.all([
    cacheStore.delete(attemptsKey(normalized)),
    cacheStore.delete(lockKey(normalized)),
  ]);
}
