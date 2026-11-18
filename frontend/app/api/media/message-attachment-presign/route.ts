import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getApiGatewayBaseUrl } from "@/lib/env/server";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { messageAttachmentPresignSchema } from "@/lib/security/validation";

function getMessageAttachmentPresignUrl() {
  const configuredPath = process.env.API_GATEWAY_MESSAGE_ATTACHMENT_PRESIGN_PATH?.trim();
  const path = configuredPath && configuredPath.length > 0 ? configuredPath : "/2424-media-attachment-presign";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiGatewayBaseUrl()}${normalizedPath}`;
}

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Connexion requise pour téléverser un fichier." }, { status: 401 });
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: "Origin non autorisée." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Origin invalide." }, { status: 403 });
    }
  }

  const uploadRateLimit = await consumeRateLimit({
    scope: "message-attachment-presign",
    subject: `${session.wpUserId}:${getClientIp(request)}`,
    limit: 20,
    windowSeconds: 5 * 60,
  });
  if (!uploadRateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes d'upload. Merci de patienter." },
      { status: 429, headers: { "Retry-After": String(uploadRateLimit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedBody = messageAttachmentPresignSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Données de fichier invalides." }, { status: 400 });
  }

  try {
    const response = await fetch(getMessageAttachmentPresignUrl(), {
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
        { error: getUserFacingErrorMessage(payload?.error, "Impossible de générer l'URL d'upload du fichier.") },
        { status: response.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Le presign du fichier a échoué.") },
      { status: 502 },
    );
  }
}
