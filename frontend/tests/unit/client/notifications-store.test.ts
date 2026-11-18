import { afterEach, describe, expect, it } from "vitest";
import {
  getNotificationsSnapshot,
  replaceNotifications,
  setNotificationsStoreUser,
} from "@/lib/client/notifications-store";

const notifications = [
  {
    id: "notification-1",
    kind: "message" as const,
    title: "Nouveau message",
    body: "Bonjour",
    timeLabel: "A l'instant",
    isUnread: true,
  },
];

afterEach(() => {
  setNotificationsStoreUser("");
});

describe("notifications client store", () => {
  it("keeps the existing list when polling returns identical data", () => {
    setNotificationsStoreUser("user@example.com");
    expect(replaceNotifications("user@example.com", notifications, 1)).toBe(true);
    const previousItems = getNotificationsSnapshot().items;

    expect(replaceNotifications("user@example.com", [...notifications], 1)).toBe(false);
    expect(getNotificationsSnapshot().items).toBe(previousItems);
  });

  it("clears the snapshot only when the authenticated user changes", () => {
    setNotificationsStoreUser("user@example.com");
    replaceNotifications("user@example.com", notifications, 1);

    setNotificationsStoreUser("other@example.com");

    expect(getNotificationsSnapshot()).toMatchObject({
      userKey: "other@example.com",
      items: [],
      unreadCount: 0,
      hasLoaded: false,
    });
  });
});
