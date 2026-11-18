import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const randomUUIDMock = vi.fn();
const getWordPressPublicListingsMock = vi.fn();
const getWordPressUserProfileMock = vi.fn();
const getServerSessionMock = vi.fn();
const isEmailVerificationRequiredMock = vi.fn();
const appendListingMessageMock = vi.fn();
const getListingMessagesMock = vi.fn();
const dispatchEmailMock = vi.fn();
const getMessageNotificationEmailOptionsMock = vi.fn();
const addNotificationMock = vi.fn();
const markMessageNotificationsReadMock = vi.fn();
const normalizeNotificationUserKeyMock = vi.fn();
const consumeRateLimitMock = vi.fn();
const getClientIpMock = vi.fn();

vi.mock("crypto", () => ({
  randomUUID: randomUUIDMock,
}));

vi.mock("@/lib/api/wordpress-internal", () => ({
  getWordPressPublicListings: getWordPressPublicListingsMock,
  getWordPressUserProfile: getWordPressUserProfileMock,
}));

vi.mock("@/lib/auth/session", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/auth/email-verification", () => ({
  isEmailVerificationRequired: isEmailVerificationRequiredMock,
}));

vi.mock("@/lib/messages/listing-messages", () => ({
  appendListingMessage: appendListingMessageMock,
  getListingMessages: getListingMessagesMock,
}));

vi.mock("@/lib/notifications/email-dispatcher", () => ({
  dispatchEmail: dispatchEmailMock,
}));

vi.mock("@/lib/notifications/message-email", () => ({
  getMessageNotificationEmailOptions: getMessageNotificationEmailOptionsMock,
}));

vi.mock("@/lib/notifications/store", () => ({
  addNotification: addNotificationMock,
  markMessageNotificationsRead: markMessageNotificationsReadMock,
  normalizeNotificationUserKey: normalizeNotificationUserKeyMock,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
  getClientIp: getClientIpMock,
}));

async function loadFactory() {
  const module = await import("@/lib/messages/listing-thread-helpers");
  return module.createListingThreadHandlers;
}

describe("listing thread handlers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    randomUUIDMock.mockReturnValue("uuid-message-1");
    getServerSessionMock.mockReturnValue({
      wpUserId: 42,
      email: "owner@example.com",
      name: "Rija Owner",
      username: "rija",
    });
    isEmailVerificationRequiredMock.mockReturnValue(false);
    consumeRateLimitMock.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    getClientIpMock.mockReturnValue("127.0.0.1");
    normalizeNotificationUserKeyMock.mockImplementation((value: string) => String(value || "").trim().toLowerCase());
    getWordPressUserProfileMock.mockResolvedValue({
      firstName: "Alice",
      lastName: "Candidate",
      displayName: "Alice Candidate",
    });
    getWordPressPublicListingsMock.mockResolvedValue({
      items: [
        {
          id: 10,
          title: "Responsable logistique",
          ownerEmail: "owner@example.com",
          ownerWpUserId: 42,
        },
      ],
    });
    getMessageNotificationEmailOptionsMock.mockResolvedValue({
      shouldSendEmail: true,
      preferencesUrl: "https://2424.mg/preferences",
      unsubscribeUrl: "https://2424.mg/unsubscribe",
    });
    dispatchEmailMock.mockResolvedValue({
      ok: true,
    });
    appendListingMessageMock.mockResolvedValue([]);
    addNotificationMock.mockResolvedValue([]);
    process.env.NEXT_PUBLIC_SITE_URL = "https://2424.mg";
  });

  it("loads the owner conversation and marks related message notifications as read", async () => {
    getListingMessagesMock.mockResolvedValue([
      {
        id: "m1",
        kind: "job",
        listingId: 10,
        senderWpUserId: 100,
        senderName: "Alice",
        senderEmail: "alice@example.com",
        recipientEmail: "owner@example.com",
        content: "<p>Bonjour, je suis intéressée.</p>",
        createdAt: "2026-06-11T08:00:00.000Z",
        status: "new",
      },
      {
        id: "m2",
        kind: "job",
        listingId: 10,
        senderWpUserId: 42,
        senderName: "Rija Owner",
        senderEmail: "owner@example.com",
        recipientEmail: "alice@example.com",
        content: "<p>Merci pour votre message.</p>",
        createdAt: "2026-06-11T08:05:00.000Z",
        status: "reviewed",
      },
    ]);

    const createListingThreadHandlers = await loadFactory();
    const { GET } = createListingThreadHandlers({
      kind: "job",
      basePath: "/offres-emploi",
      fallbackPrefix: "offre",
      ownerLabel: "Offre d'emploi",
    });

    const request = new NextRequest("http://localhost/api/messages/job/thread?listingId=10&participant=alice@example.com");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.participantEmail).toBe("alice@example.com");
    expect(data.participantName).toBe("Alice Candidate");
    expect(data.messages).toHaveLength(2);
    expect(markMessageNotificationsReadMock).toHaveBeenCalledWith("owner@example.com", {
      listingId: "10",
      channel: "job",
      href: "https://2424.mg/offres-emploi/responsable-logistique-10/contacter?participant=alice%40example.com",
    });
  });

  it("creates a thread message, dispatches email and stores a notification", async () => {
    getServerSessionMock.mockReturnValue({
      wpUserId: 100,
      email: "candidate@example.com",
      name: "Alice Candidate",
      username: "alice",
    });

    const createListingThreadHandlers = await loadFactory();
    const { POST } = createListingThreadHandlers({
      kind: "job",
      basePath: "/offres-emploi",
      fallbackPrefix: "offre",
      ownerLabel: "Offre d'emploi",
    });

    const request = new NextRequest("http://localhost/api/messages/job/thread", {
      method: "POST",
      body: JSON.stringify({
        listingId: 10,
        message: "<p>Bonjour, je souhaite postuler.</p>",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(appendListingMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "uuid-message-1",
        listingId: 10,
        senderEmail: "candidate@example.com",
        recipientEmail: "owner@example.com",
        status: "new",
      }),
    );
    expect(dispatchEmailMock).toHaveBeenCalled();
    expect(addNotificationMock).toHaveBeenCalledWith(
      "owner@example.com",
      expect.objectContaining({
        id: "uuid-message-1",
        kind: "message",
        metadata: {
          listingId: "10",
          channel: "job",
        },
      }),
    );
    expect(data).toMatchObject({
      ok: true,
      message: {
        id: "uuid-message-1",
        isMine: true,
      },
    });
  });
});
