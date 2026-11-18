import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const getNotificationsMock = vi.fn();
const markAllNotificationsReadMock = vi.fn();
const markNotificationReadMock = vi.fn();
const normalizeNotificationUserKeyMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/notifications/store", () => ({
  getNotifications: getNotificationsMock,
  markAllNotificationsRead: markAllNotificationsReadMock,
  markNotificationRead: markNotificationReadMock,
  normalizeNotificationUserKey: normalizeNotificationUserKeyMock,
}));

async function loadRoute() {
  const module = await import("@/app/api/notifications/route");
  return {
    GET: module.GET,
    POST: module.POST,
  };
}

describe("notifications route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    normalizeNotificationUserKeyMock.mockImplementation((value: string) => String(value || "").trim().toLowerCase());
  });

  it("returns empty notifications when no authenticated email is available", async () => {
    getServerSessionMock.mockReturnValue(null);
    const { GET } = await loadRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      items: [],
      unreadCount: 0,
    });
  });

  it("returns notifications with unread count and computed flags", async () => {
    getServerSessionMock.mockReturnValue({
      email: "user@example.com",
    });
    getNotificationsMock.mockResolvedValue([
      {
        id: "n1",
        kind: "message",
        title: "Nouveau message",
        body: "Vous avez reçu une réponse.",
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        readAt: null,
      },
      {
        id: "n2",
        kind: "billing",
        title: "Facture",
        body: "Paiement confirmé.",
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        readAt: new Date().toISOString(),
      },
    ]);
    const { GET } = await loadRoute();

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.unreadCount).toBe(1);
    expect(data.items[0]).toMatchObject({
      id: "n1",
      isUnread: true,
    });
    expect(typeof data.items[0].timeLabel).toBe("string");
    expect(data.items[1]).toMatchObject({
      id: "n2",
      isUnread: false,
    });
  });

  it("requires authentication for notification mutations", async () => {
    getServerSessionMock.mockReturnValue(null);
    const { POST } = await loadRoute();
    const request = new Request("http://localhost/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "mark-all-read" }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Connexion requise.",
    });
  });

  it("marks a single notification as read", async () => {
    getServerSessionMock.mockReturnValue({
      email: "user@example.com",
    });
    markNotificationReadMock.mockResolvedValue([
      { id: "n1", readAt: new Date().toISOString() },
      { id: "n2", readAt: null },
    ]);
    const { POST } = await loadRoute();
    const request = new Request("http://localhost/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "mark-read", notificationId: "n1" }),
    });

    const response = await POST(request as never);

    expect(markNotificationReadMock).toHaveBeenCalledWith("user@example.com", "n1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      unreadCount: 1,
    });
  });

  it("rejects invalid notification actions", async () => {
    getServerSessionMock.mockReturnValue({
      email: "user@example.com",
    });
    const { POST } = await loadRoute();
    const request = new Request("http://localhost/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Action de notification invalide.",
    });
  });
});
