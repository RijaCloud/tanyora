import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/security/rate-limit";

type ChatMessage = { role: "user" | "assistant"; content: string };

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.trim().length > 0 && message.content.length <= 800;
}

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.wpUserId || session.onboardingCompleted === false) {
    return NextResponse.json({ error: "Connectez-vous pour utiliser l'assistant." }, { status: 401 });
  }

  const serviceUrl = process.env.TANYORA_ASSISTANT_SERVICE_URL?.trim();
  const serviceSecret = process.env.TANYORA_ASSISTANT_SERVICE_SECRET?.trim();
  if (!serviceUrl || !serviceSecret || process.env.TANYORA_ASSISTANT_ENABLED !== "true") {
    return NextResponse.json({ error: "L'assistant est en préparation." }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
    }
  }

  const limit = await consumeRateLimit({ scope: "tanyora-assistant", subject: String(session.wpUserId), limit: 12, windowSeconds: 15 * 60 });
  if (!limit.allowed) return NextResponse.json({ error: "Trop de questions pour le moment. Réessayez plus tard." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 8 || !messages.every(isChatMessage) || messages.at(-1)?.role !== "user") {
    return NextResponse.json({ error: "Question invalide." }, { status: 400 });
  }

  try {
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-tanyora-assistant-secret": serviceSecret },
      body: JSON.stringify({ messages }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return NextResponse.json({ error: "L'assistant est momentanément indisponible." }, { status: 502 });
    const payload = await response.json();
    if (typeof payload?.answer !== "string" || payload.answer.length > 2000) throw new Error("Invalid assistant response");
    return NextResponse.json({ answer: payload.answer }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "L'assistant est momentanément indisponible." }, { status: 502 });
  }
}
