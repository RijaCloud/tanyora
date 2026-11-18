import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getApiGatewayUrl } from "@/lib/env/server";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { mediaPresignSchema } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Connexion requise pour televerser un media." }, { status: 401 });
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: "Origin non autorisee." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Origin invalide." }, { status: 403 });
    }
  }

  const uploadRateLimit = await consumeRateLimit({
    scope: "media-presign",
    subject: `${session.wpUserId}:${getClientIp(request)}`,
    limit: 40,
    windowSeconds: 5 * 60,
  });
  if (!uploadRateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes d'upload. Merci de patienter." },
      { status: 429, headers: { "Retry-After": String(uploadRateLimit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedBody = mediaPresignSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const response = await fetch(getApiGatewayUrl("API_GATEWAY_MEDIA_PRESIGN_PATH", "/media/presign"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedBody.data),
      cache: "no-store",
    });

    const text = await response.text();
    const payload = text
      ? ((() => {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        })())
      : null;

    if (!response.ok) {
      return NextResponse.json(
        { error: getUserFacingErrorMessage(payload?.error, "Unable to generate media upload URL.") },
        { status: response.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Media presign failed.") },
      { status: 502 },
    );
  }
}

