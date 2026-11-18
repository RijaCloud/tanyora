import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function rejectExcessiveEditorialTraffic(request: NextRequest) {
  const decision = await consumeRateLimit({
    scope: "editorial-public-read",
    subject: getClientIp(request),
    limit: 120,
    windowSeconds: 60,
  });

  if (decision.allowed) return null;

  return NextResponse.json(
    { error: "Trop de requetes. Reessayez dans un instant." },
    {
      status: 429,
      headers: {
        "Retry-After": String(decision.retryAfterSeconds),
      },
    },
  );
}
