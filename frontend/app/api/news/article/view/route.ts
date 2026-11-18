import { NextRequest, NextResponse } from "next/server";
import { incrementWordPressNewsArticleView } from "@/lib/api/wordpress-internal";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return true;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function isKnownBot(userAgent: string): boolean {
  return /bot|crawl|spider|preview|facebookexternalhit|whatsapp|curl|headlesschrome/i.test(userAgent);
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: "Origine non autorisee." }, { status: 403 });
    }

    if (isKnownBot(request.headers.get("user-agent") || "")) {
      return new NextResponse(null, { status: 204 });
    }

    const rateLimit = await consumeRateLimit({
      scope: "news-view",
      subject: getClientIp(request),
      limit: 60,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes. Merci de patienter." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const payload = (await request.json()) as { slug?: string; postId?: number };
    const slug = typeof payload?.slug === "string" ? payload.slug.trim() : "";
    const postId = typeof payload?.postId === "number" ? payload.postId : undefined;

    if (!slug && !postId) {
      return NextResponse.json({ error: "Article introuvable." }, { status: 400 });
    }

    const result = await incrementWordPressNewsArticleView({
      ...(slug ? { slug } : {}),
      ...(postId ? { postId } : {}),
    });

    return NextResponse.json({ counted: result.counted === true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d'enregistrer la vue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
