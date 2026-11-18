"use client";

import { useSyncExternalStore } from "react";

export type ClientNotification = {
  id: string;
  kind: "message" | "billing" | "system";
  title: string;
  body: string;
  href?: string;
  timeLabel: string;
  isUnread: boolean;
};

type NotificationsSnapshot = {
  userKey: string;
  items: ClientNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasLoaded: boolean;
};

const EMPTY_SNAPSHOT: NotificationsSnapshot = {
  userKey: "",
  items: [],
  unreadCount: 0,
  isLoading: false,
  hasLoaded: false,
};

let snapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

function emit(next: NotificationsSnapshot) {
  if (next === snapshot) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function sameItems(left: ClientNotification[], right: ClientNotification[]) {
  return left.length === right.length && left.every((item, index) => {
    const candidate = right[index];
    return item.id === candidate?.id
      && item.kind === candidate.kind
      && item.title === candidate.title
      && item.body === candidate.body
      && item.href === candidate.href
      && item.timeLabel === candidate.timeLabel
      && item.isUnread === candidate.isUnread;
  });
}

export function useNotificationsStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => EMPTY_SNAPSHOT,
  );
}

export function getNotificationsSnapshot() {
  return snapshot;
}

export function setNotificationsStoreUser(userKey: string) {
  if (snapshot.userKey === userKey) return;
  emit({ ...EMPTY_SNAPSHOT, userKey });
}

export function setNotificationsLoading(userKey: string, isLoading: boolean) {
  if (snapshot.userKey !== userKey || snapshot.isLoading === isLoading) return;
  emit({ ...snapshot, isLoading });
}

export function replaceNotifications(userKey: string, items: ClientNotification[], unreadCount: number) {
  if (snapshot.userKey !== userKey) return false;
  const normalizedUnreadCount = Math.max(0, unreadCount);
  if (snapshot.hasLoaded && sameItems(snapshot.items, items) && snapshot.unreadCount === normalizedUnreadCount) {
    return false;
  }

  emit({
    ...snapshot,
    items,
    unreadCount: normalizedUnreadCount,
    isLoading: false,
    hasLoaded: true,
  });
  return true;
}

export function updateNotifications(updater: (items: ClientNotification[]) => ClientNotification[], unreadCount?: number) {
  const items = updater(snapshot.items);
  const nextUnreadCount = unreadCount === undefined ? snapshot.unreadCount : Math.max(0, unreadCount);
  if (sameItems(snapshot.items, items) && snapshot.unreadCount === nextUnreadCount) return;
  emit({ ...snapshot, items, unreadCount: nextUnreadCount, hasLoaded: true });
}
