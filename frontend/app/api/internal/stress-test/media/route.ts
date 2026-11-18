import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getApiGatewayUrl } from "@/lib/env/server";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLJYQAAAABJRU5ErkJggg==", "base64");

function authorized(request: NextRequest) {
  const expected = process.env.PLATFORM_SUBMISSIONS_SECRET?.trim();
  const received = request.headers.get("x-2424-internal-secret")?.trim();
  if (!expected || !received) return false;
  const a = Buffer.from(expected); const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

function staging(request: NextRequest) {
  return ["staging.2424.mg", "2424.winfordcap.com", "localhost", "127.0.0.1"].includes(request.nextUrl.hostname.toLowerCase());
}

/**
 * This server-only route exercises the production presign + S3 PUT contract.
 * It deliberately tracks exact returned keys instead of accepting a caller
 * supplied prefix, so an admin request can never cause arbitrary S3 deletion.
 */
export async function POST(request: NextRequest) {
  if (!authorized(request) || !staging(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const campaignId = String(body?.campaignId || "").trim();
  const offset = Math.max(0, Math.floor(Number(body?.offset) || 0));
  const count = Math.min(1, Math.max(1, Math.floor(Number(body?.count) || 0)));
  if (!/^[a-f0-9-]{36}$/i.test(campaignId) || offset + count > 1000) return NextResponse.json({ error: "Invalid stress-test media request" }, { status: 400 });
  try {
    const uploads = [];
    for (let index = 0; index < count; index++) {
      const presign = await fetch(getApiGatewayUrl("API_GATEWAY_MEDIA_PRESIGN_PATH", "/media/presign"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mimeType: "image/png", sizeBytes: PNG.length }), cache: "no-store" });
      const payload = await presign.json().catch(() => null);
      if (!presign.ok || !payload?.uploadUrl || !payload?.key || !payload?.publicUrl || !String(payload.key).startsWith("uploads/")) throw new Error("Media presign rejected");
      const put = await fetch(payload.uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: PNG });
      if (!put.ok) throw new Error("S3 upload rejected");
      uploads.push({ key: String(payload.key), publicUrl: String(payload.publicUrl), kind: offset + index < 500 ? "avatar" : "listing" });
    }
    return NextResponse.json({ ok: true, uploads });
  } catch {
    return NextResponse.json({ error: "Stress-test media upload unavailable" }, { status: 502 });
  }
}
