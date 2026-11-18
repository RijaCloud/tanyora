import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import {
  getPublicPushConfig,
  getPushSubscriptionStatus,
  removePushSubscription,
  savePushSubscription,
} from "@/lib/notifications/push";

function getUserKey() {
  return getServerSession()?.email || "";
}

export async function GET() {
  const userKey = getUserKey();
  if (!userKey) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  return NextResponse.json(await getPushSubscriptionStatus(userKey));
}

export async function POST(request: NextRequest) {
  const userKey = getUserKey();
  if (!userKey) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (!(await getPublicPushConfig()).configured) return NextResponse.json({ error: "Les notifications push ne sont pas configurees." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const saved = await savePushSubscription(userKey, body?.subscription);
  if (!saved) return NextResponse.json({ error: "Abonnement push invalide ou indisponible." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const userKey = getUserKey();
  if (!userKey) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const removed = await removePushSubscription(userKey, String(body?.endpoint || ""));
  return NextResponse.json({ ok: removed });
}
