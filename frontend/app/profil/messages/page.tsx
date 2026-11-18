import { buildMetadata } from "@/app/metadata";
import { MessagesDashboardPage } from "@/features/profile/components/MessagesDashboardPage";
import {
  getWordPressPublicListings,
  getWordPressUserWorkspaceItems,
  type PublicListingItem,
  type PublicListingKind,
} from "@/lib/api/wordpress-internal";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getServerSession } from "@/lib/auth/session";
import { getMessageAttachmentPreviewLabel } from "@/lib/messages/attachments";
import { getClassifiedMessages } from "@/lib/messages/classified-messages";
import { getListingMessages, getUserListingConversationSummaries } from "@/lib/messages/listing-messages";
import { extractMessagePlainText } from "@/lib/messages/message-content";
import { buildListingSlug } from "@/lib/listings/slug";
import { normalizeNotificationUserKey } from "@/lib/notifications/channel";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata(
  "Mes messages",
  "Consultez vos conversations petites annonces, offres d'emploi et appels d'offres depuis votre tableau de bord.",
);

type WorkspaceListingItem = {
  id: string;
  title: string;
  image?: string;
  price?: string;
  location?: string;
};

type ConversationCard = {
  id: string;
  kind: "classified" | "job" | "tender";
  listingId: number;
  listingTitle: string;
  listingImage: string;
  listingPrice: string;
  listingLocation: string;
  participantName: string;
  participantEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  conversationHref: string;
  listingHref: string;
};

type MessageModuleConfig = {
  kind: "classified" | "job" | "tender";
  workspaceTitle: string;
  basePath: string;
  fallbackPrefix: string;
};

const MESSAGE_MODULES: MessageModuleConfig[] = [
  { kind: "classified", workspaceTitle: "Mes annonces", basePath: "/petites-annonces", fallbackPrefix: "annonce" },
  { kind: "job", workspaceTitle: "Mes offres", basePath: "/offres-emploi", fallbackPrefix: "offre" },
  { kind: "tender", workspaceTitle: "Mes appels d'offres", basePath: "/appels-offres", fallbackPrefix: "appel-offres" },
];

function buildConversationHref(config: MessageModuleConfig, listingId: number, listingTitle: string, participantEmail?: string) {
  const slug = buildListingSlug(listingId, listingTitle, config.fallbackPrefix);
  const basePath = `${config.basePath}/${slug}/contacter`;
  return participantEmail ? `${basePath}?participant=${encodeURIComponent(participantEmail)}` : basePath;
}

function buildListingHref(config: MessageModuleConfig, listingId: number, listingTitle: string) {
  return `${config.basePath}/${buildListingSlug(listingId, listingTitle, config.fallbackPrefix)}`;
}

function ensureConversationCardImage(image?: string | null) {
  return String(image || "").trim() || "/image-placeholder.png";
}

function getConversationPreview(content: string, attachment?: { fileName?: string }, attachments?: Array<{ fileName?: string; url?: string; mimeType?: string; sizeBytes?: number }>) {
  const plainText = extractMessagePlainText(content);
  if (plainText) {
    return plainText;
  }
  return getMessageAttachmentPreviewLabel({ attachment, attachments });
}

async function getModuleListingMessages(config: MessageModuleConfig, listingId: number) {
  return config.kind === "classified" ? getClassifiedMessages(listingId) : getListingMessages(config.kind, listingId);
}

function getConversationListingPrice(config: MessageModuleConfig, listing?: PublicListingItem | null, workspaceItem?: WorkspaceListingItem | null) {
  if (config.kind === "tender") {
    return String(listing?.budget || workspaceItem?.price || "").trim();
  }
  if (config.kind === "classified") {
    return String(listing?.price || workspaceItem?.price || "").trim();
  }
  return "";
}

async function groupOwnerConversations(
  config: MessageModuleConfig,
  items: WorkspaceListingItem[],
  viewerEmail: string,
): Promise<ConversationCard[]> {
  const normalizedViewerEmail = normalizeNotificationUserKey(viewerEmail);

  return Promise.all(
    items.map(async (item) => {
      const listingId = Number.parseInt(item.id, 10);
      if (!Number.isFinite(listingId) || listingId <= 0) {
        return [];
      }

      const messages = await getModuleListingMessages(config, listingId);
      const grouped = new Map<
        string,
        {
          participantEmail: string;
          participantName: string;
          lastMessage: string;
          lastMessageAt: string;
          messageCount: number;
        }
      >();

      for (const message of messages) {
        const normalizedSenderEmail = normalizeNotificationUserKey(message.senderEmail);
        const normalizedRecipientEmail = normalizeNotificationUserKey(message.recipientEmail);
        const participantEmail =
          normalizedSenderEmail === normalizedViewerEmail ? normalizedRecipientEmail : normalizedSenderEmail;

        if (!participantEmail || participantEmail === normalizedViewerEmail) {
          continue;
        }

        const participantName =
          normalizedSenderEmail === participantEmail
            ? message.senderName || participantEmail
            : grouped.get(participantEmail)?.participantName || participantEmail;

        const current = grouped.get(participantEmail);
        const currentTimestamp = current ? new Date(current.lastMessageAt).getTime() : 0;
        const nextTimestamp = new Date(message.createdAt).getTime();

        grouped.set(participantEmail, {
          participantEmail,
          participantName,
          lastMessage: !current || nextTimestamp >= currentTimestamp ? getConversationPreview(message.content, message.attachment, message.attachments) : current.lastMessage,
          lastMessageAt: !current || nextTimestamp >= currentTimestamp ? message.createdAt : current.lastMessageAt,
          messageCount: (current?.messageCount || 0) + 1,
        });
      }

      return Array.from(grouped.values()).map((entry) => ({
        id: `received:${config.kind}:${listingId}:${entry.participantEmail}`,
        kind: config.kind,
        listingId,
        listingTitle: item.title,
        listingImage: ensureConversationCardImage(item.image),
        listingPrice: String(item.price || "").trim(),
        listingLocation: item.location || "Madagascar",
        participantName: entry.participantName,
        participantEmail: entry.participantEmail,
        lastMessage: entry.lastMessage,
        lastMessageAt: entry.lastMessageAt,
        messageCount: entry.messageCount,
        conversationHref: buildConversationHref(config, listingId, item.title, entry.participantEmail),
        listingHref: buildListingHref(config, listingId, item.title),
      }));
    }),
  ).then((groups) =>
    groups
      .flat()
      .sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime()),
  );
}

async function loadPublicListingMap(config: MessageModuleConfig, listingIds: number[]) {
  const entries = await Promise.all(
    listingIds.map(async (listingId) => {
      try {
        const result = await getWordPressPublicListings(config.kind as PublicListingKind, { id: listingId, perPage: 1 });
        return [listingId, result.items[0] || null] as const;
      } catch {
        return [listingId, null] as const;
      }
    }),
  );

  return new Map<number, PublicListingItem | null>(entries);
}

export default async function ProfilMessagesPage({
  searchParams,
}: {
  searchParams?: { listingId?: string };
}) {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: "/profil/messages" });
  const initialListingId = Number.parseInt(String(searchParams?.listingId || "0"), 10);
  const wpUserId = Number.parseInt(String(session.wpUserId || "0"), 10);
  const viewerEmail = String(session.email || "").trim().toLowerCase();

  const ownListingsResult =
    Number.isFinite(wpUserId) && wpUserId > 0
      ? await Promise.all(
          MESSAGE_MODULES.map(async (config) => ({
            config,
            workspace: await getWordPressUserWorkspaceItems(config.kind, { wpUserId }).catch(() => ({
              title: config.workspaceTitle,
              items: [],
            })),
          })),
        )
      : MESSAGE_MODULES.map((config) => ({ config, workspace: { title: config.workspaceTitle, items: [] } }));

  const conversationGroups = await Promise.all(
    ownListingsResult.map(async ({ config, workspace }) => {
      const ownListings = (workspace.items || []) as WorkspaceListingItem[];
      const ownListingIds = new Set(
        ownListings
          .map((item) => Number.parseInt(String(item.id || "0"), 10))
          .filter((value) => Number.isFinite(value) && value > 0),
      );

      const [receivedConversations, userConversationSummaries] = await Promise.all([
        groupOwnerConversations(config, ownListings, viewerEmail),
        getUserListingConversationSummaries(config.kind, viewerEmail),
      ]);

      const sentSummaries = userConversationSummaries.filter((summary) => !ownListingIds.has(summary.listingId));
      const publicListingMap = await loadPublicListingMap(
        config,
        Array.from(new Set(sentSummaries.map((summary) => summary.listingId))),
      );

      const sentConversations: ConversationCard[] = sentSummaries
        .map((summary) => {
          const listing = publicListingMap.get(summary.listingId);
          const listingTitle = listing?.title || `Publication #${summary.listingId}`;
          return {
            id: `sent:${config.kind}:${summary.listingId}:${summary.participantEmail}`,
            kind: config.kind,
            listingId: summary.listingId,
            listingTitle,
            listingImage: ensureConversationCardImage(listing?.image),
            listingPrice: getConversationListingPrice(config, listing),
            listingLocation: listing?.location || "Madagascar",
            participantName: listing?.companyName || listing?.publisherName || summary.participantName || summary.participantEmail,
            participantEmail: summary.participantEmail,
            lastMessage: summary.lastMessage,
            lastMessageAt: summary.lastMessageAt,
            messageCount: summary.messageCount,
            conversationHref: buildConversationHref(config, summary.listingId, listingTitle),
            listingHref: buildListingHref(config, summary.listingId, listingTitle),
          };
        })
        .sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());

      return {
        receivedConversations,
        sentConversations,
      };
    }),
  );

  const receivedConversations = conversationGroups
    .flatMap((group) => group.receivedConversations)
    .sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());
  const sentConversations = conversationGroups
    .flatMap((group) => group.sentConversations)
    .sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());

  return (
    <MessagesDashboardPage
      receivedConversations={receivedConversations}
      sentConversations={sentConversations}
      initialListingId={Number.isFinite(initialListingId) && initialListingId > 0 ? initialListingId : null}
    />
  );
}
