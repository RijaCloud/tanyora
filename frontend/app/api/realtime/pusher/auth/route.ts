import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { buildNotificationChannelName, normalizeNotificationUserKey } from "@/lib/notifications/channel";
import { getPusherServer, isPusherConfigured } from "@/lib/realtime/pusher-server";

export async function POST(request: NextRequest) {
  const session = getServerSession();
  const userKey = normalizeNotificationUserKey(session?.email || "");

  if (!userKey) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  if (!isPusherConfigured()) {
    return NextResponse.json({ error: "Temps reel indisponible." }, { status: 503 });
  }

  const body = await request.formData().catch(() => null);
  const socketId = String(body?.get("socket_id") || "").trim();
  const channelName = String(body?.get("channel_name") || "").trim();

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Parametres Pusher invalides." }, { status: 400 });
  }

  const expectedChannel = buildNotificationChannelName(userKey);
  if (channelName !== expectedChannel) {
    return NextResponse.json({ error: "Canal non autorise." }, { status: 403 });
  }

  const auth = getPusherServer().authorizeChannel(socketId, channelName);
  return NextResponse.json(auth);
}
