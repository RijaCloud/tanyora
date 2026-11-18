import { getMessageAttachmentPreviewLabel } from "@/lib/messages/attachments";
import type { FollowUpItem } from "@/features/profile/workspace-mocks";
import { extractMessagePlainText } from "@/lib/messages/message-content";
import type { ListingMessage, ListingMessageKind } from "@/lib/messages/listing-messages";

type BuildFollowUpEntriesOptions = {
  messages: ListingMessage[];
  kind: Extract<ListingMessageKind, "job" | "tender">;
  listingSlug: string;
  titlePrefix: string;
  ownerEmail: string;
  actionLabel?: string;
};

function formatFollowUpDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildFollowUpDescription(message: ListingMessage) {
  const plainText = extractMessagePlainText(String(message.content || ""));
  if (plainText) {
    return plainText;
  }

  return getMessageAttachmentPreviewLabel(message);
}

function buildConversationHref(kind: Extract<ListingMessageKind, "job" | "tender">, listingSlug: string, participantEmail: string) {
  const basePath = kind === "job" ? `/offres-emploi/${listingSlug}/contacter` : `/appels-offres/${listingSlug}/contacter`;
  return `${basePath}?participant=${encodeURIComponent(participantEmail)}`;
}

export function buildFollowUpEntriesFromMessages({
  messages,
  kind,
  listingSlug,
  titlePrefix,
  ownerEmail,
  actionLabel = "Ouvrir la discussion",
}: BuildFollowUpEntriesOptions): FollowUpItem[] {
  const normalizedOwnerEmail = String(ownerEmail || "").trim().toLowerCase();
  const groupedByParticipant = new Map<
    string,
    {
      participantEmail: string;
      participantName: string;
      description: string;
      createdAt: string;
      status: FollowUpItem["status"];
    }
  >();

  for (const message of messages) {
    const participantEmail = String(message.senderEmail || "").trim().toLowerCase();
    if (!participantEmail || participantEmail === normalizedOwnerEmail) {
      continue;
    }

    const participantName = String(message.senderName || "").trim() || participantEmail;
    const description = buildFollowUpDescription(message);
    const existing = groupedByParticipant.get(participantEmail);
    const nextTimestamp = new Date(message.createdAt).getTime();
    const currentTimestamp = existing ? new Date(existing.createdAt).getTime() : 0;

    if (!existing || nextTimestamp >= currentTimestamp) {
      groupedByParticipant.set(participantEmail, {
        participantEmail,
        participantName,
        description,
        createdAt: message.createdAt,
        status: message.status,
      });
    }
  }

  return Array.from(groupedByParticipant.values())
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((entry) => ({
      id: `${kind}:${entry.participantEmail}`,
      title: `${titlePrefix} ${entry.participantName}`,
      description: entry.description,
      meta: `${entry.participantEmail} · ${formatFollowUpDate(entry.createdAt)}`,
      status: entry.status,
      conversationHref: buildConversationHref(kind, listingSlug, entry.participantEmail),
      actionLabel,
    }));
}
