import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeNotificationUserKey,
} from "@/lib/notifications/store";

function formatNotificationTime(value: string): string {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "A l'instant";
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "A l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Il y a ${diffDays} j`;

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(createdAt);
}

export async function GET() {
  const session = getServerSession();
  const userKey = normalizeNotificationUserKey(session?.email || "");

  if (!userKey) {
    return NextResponse.json({ ok: true, items: [], unreadCount: 0 });
  }

  const notifications = await getNotifications(userKey);
  const items = notifications.map((item) => ({
    ...item,
    timeLabel: formatNotificationTime(item.createdAt),
    isUnread: !item.readAt,
  }));

  return NextResponse.json({
    ok: true,
    items,
    unreadCount: items.filter((item) => item.isUnread).length,
  });
}

export async function POST(request: NextRequest) {
  const session = getServerSession();
  const userKey = normalizeNotificationUserKey(session?.email || "");

  if (!userKey) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const action = String(body?.action || "").trim();
  const notificationId = String(body?.notificationId || "").trim();

  const items =
    action === "mark-all-read"
      ? await markAllNotificationsRead(userKey)
      : action === "mark-read" && notificationId
        ? await markNotificationRead(userKey, notificationId)
        : action === "delete" && notificationId
          ? await deleteNotification(userKey, notificationId)
        : null;

  if (!items) {
    return NextResponse.json({ error: "Action de notification invalide." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    unreadCount: items.filter((item) => !item.readAt).length,
  });
}
