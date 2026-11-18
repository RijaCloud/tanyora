import { cacheStore } from "@/lib/cache";
import {
  getMessageAttachmentPreviewLabel,
  normalizeMessageAttachments,
  type MessageAttachment,
} from "@/lib/messages/attachments";
import { normalizeNotificationUserKey } from "@/lib/notifications/channel";
import { extractMessagePlainText } from "@/lib/messages/message-content";

export type ListingMessageKind = "classified" | "job" | "tender";

export type ListingMessage = {
  id: string;
  kind: ListingMessageKind;
  listingId: number;
  senderWpUserId: number;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  content: string;
  attachment?: MessageAttachment;
  attachments?: MessageAttachment[];
  createdAt: string;
  status: "new" | "reviewed" | "archived";
};

export type ListingConversationSummary = {
  kind: ListingMessageKind;
  listingId: number;
  participantEmail: string;
  participantName: string;
  messageCount: number;
  lastMessage: string;
  lastMessageAt: string;
};

function getListingMessageSummary(message: ListingMessage) {
  const plainText = extractMessagePlainText(String(message.content || ""));
  if (plainText) {
    return plainText;
  }

  return getMessageAttachmentPreviewLabel(message);
}

const MESSAGES_TTL_SECONDS = 90 * 24 * 60 * 60;
const MAX_INDEXED_LISTING_IDS = 500;

function listingMessagesKey(kind: ListingMessageKind, listingId: number): string {
  return `listing:messages:${kind}:${listingId}`;
}

function userListingIndexKey(kind: ListingMessageKind, userKey: string): string {
  return `listing:messages:index:${kind}:${normalizeNotificationUserKey(userKey)}`;
}

async function getUserListingIds(kind: ListingMessageKind, userKey: string): Promise<number[]> {
  const normalized = normalizeNotificationUserKey(userKey);
  if (!normalized) {
    return [];
  }

  const listingIds = (await cacheStore.get<number[]>(userListingIndexKey(kind, normalized))) ?? [];
  if (!Array.isArray(listingIds)) {
    return [];
  }

  return listingIds
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value, index, values) => Number.isFinite(value) && value > 0 && values.indexOf(value) === index);
}

async function setUserListingIds(kind: ListingMessageKind, userKey: string, listingIds: number[]) {
  const normalized = normalizeNotificationUserKey(userKey);
  if (!normalized) {
    return;
  }

  const next = listingIds
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value, index, values) => Number.isFinite(value) && value > 0 && values.indexOf(value) === index)
    .slice(0, MAX_INDEXED_LISTING_IDS);

  await cacheStore.set(userListingIndexKey(kind, normalized), next, MESSAGES_TTL_SECONDS);
}

async function addListingIdToUserIndex(kind: ListingMessageKind, userKey: string, listingId: number) {
  if (!Number.isFinite(listingId) || listingId <= 0) {
    return;
  }

  const current = await getUserListingIds(kind, userKey);
  const next = [listingId, ...current.filter((entry) => entry !== listingId)];
  await setUserListingIds(kind, userKey, next);
}

export async function getListingMessages(kind: ListingMessageKind, listingId: number): Promise<ListingMessage[]> {
  if (!Number.isFinite(listingId) || listingId <= 0) {
    return [];
  }

  const messages = (await cacheStore.get<ListingMessage[]>(listingMessagesKey(kind, listingId))) ?? [];
  return Array.isArray(messages)
    ? messages.map((message) => {
        const attachments = normalizeMessageAttachments(message);
        return {
          ...message,
          attachment: attachments[0],
          attachments,
        };
      })
    : [];
}

export async function appendListingMessage(message: ListingMessage): Promise<ListingMessage[]> {
  const current = await getListingMessages(message.kind, message.listingId);
  const attachments = normalizeMessageAttachments(message);
  const nextMessage: ListingMessage = {
    ...message,
    attachment: attachments[0],
    attachments,
  };
  const next = [nextMessage, ...current].slice(0, 500);
  await cacheStore.set(listingMessagesKey(message.kind, message.listingId), next, MESSAGES_TTL_SECONDS);
  await Promise.all([
    addListingIdToUserIndex(nextMessage.kind, nextMessage.senderEmail, nextMessage.listingId),
    addListingIdToUserIndex(nextMessage.kind, nextMessage.recipientEmail, nextMessage.listingId),
  ]);
  return next;
}

export async function getUserListingConversationSummaries(
  kind: ListingMessageKind,
  userEmail: string,
): Promise<ListingConversationSummary[]> {
  const normalizedUserEmail = normalizeNotificationUserKey(userEmail);
  if (!normalizedUserEmail) {
    return [];
  }

  const listingIds = await getUserListingIds(kind, normalizedUserEmail);
  if (listingIds.length === 0) {
    return [];
  }

  const groupedConversations = new Map<string, ListingConversationSummary>();

  for (const listingId of listingIds) {
    const messages = await getListingMessages(kind, listingId);
    const relevantMessages = messages.filter(
      (message) =>
        normalizeNotificationUserKey(message.senderEmail) === normalizedUserEmail ||
        normalizeNotificationUserKey(message.recipientEmail) === normalizedUserEmail,
    );

    for (const message of relevantMessages) {
      const participantEmail =
        normalizeNotificationUserKey(message.senderEmail) === normalizedUserEmail
          ? normalizeNotificationUserKey(message.recipientEmail)
          : normalizeNotificationUserKey(message.senderEmail);

      if (!participantEmail) {
        continue;
      }

      const key = `${listingId}:${participantEmail}`;
      const current = groupedConversations.get(key);
      const currentTime = current ? new Date(current.lastMessageAt).getTime() : 0;
      const nextTime = new Date(message.createdAt).getTime();
      const participantName =
        normalizeNotificationUserKey(message.senderEmail) === participantEmail ? message.senderName : current?.participantName || participantEmail;

      if (!current) {
        groupedConversations.set(key, {
          kind,
          listingId,
          participantEmail,
          participantName,
          messageCount: 1,
          lastMessage: getListingMessageSummary(message),
          lastMessageAt: message.createdAt,
        });
        continue;
      }

      groupedConversations.set(key, {
        ...current,
        participantName: current.participantName || participantName,
        messageCount: current.messageCount + 1,
        lastMessage: nextTime >= currentTime ? getListingMessageSummary(message) : current.lastMessage,
        lastMessageAt: nextTime >= currentTime ? message.createdAt : current.lastMessageAt,
      });
    }
  }

  return Array.from(groupedConversations.values()).sort(
    (left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime(),
  );
}
