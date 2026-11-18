import type { NextRequest } from "next/server";
import { cacheStore } from "@/lib/cache";

type RateLimitOptions = {
  scope: string;
  subject: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}

export async function consumeRateLimit(options: RateLimitOptions): Promise<RateLimitDecision> {
  const normalizedLimit = Math.max(1, Math.floor(options.limit));
  const windowSeconds = Math.max(1, Math.floor(options.windowSeconds));
  const scope = options.scope.trim().toLowerCase() || "default";
  const subject = options.subject.trim().toLowerCase() || "anonymous";
  const key = `rate:${scope}:${subject}`;

  const count = await cacheStore.increment(key, windowSeconds);
  const allowed = count <= normalizedLimit;
  const remaining = Math.max(0, normalizedLimit - count);

  return {
    allowed,
    limit: normalizedLimit,
    remaining,
    retryAfterSeconds: allowed ? 0 : windowSeconds,
  };
}
