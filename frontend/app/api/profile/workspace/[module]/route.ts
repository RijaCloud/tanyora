import { NextRequest, NextResponse } from "next/server";
import { getWordPressPublishingAccessStatus, getWordPressUserWorkspaceItems } from "@/lib/api/wordpress-internal";
import { getClassifiedMessages } from "@/lib/messages/classified-messages";
import { getMessageAttachmentPreviewLabel } from "@/lib/messages/attachments";
import { getListingMessages, type ListingMessageKind } from "@/lib/messages/listing-messages";
import { extractMessagePlainText } from "@/lib/messages/message-content";
import { getServerSession } from "@/lib/auth/session";
import { buildListingSlug } from "@/lib/listings/slug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

function workspaceResponse(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      ...NO_STORE_HEADERS,
      ...init?.headers,
    },
  });
}

type ModuleKey = "classifieds" | "tenders" | "jobs" | "articles";

const MODULE_KIND_MAP: Record<ModuleKey, "classified" | "tender" | "article" | "job"> = {
  classifieds: "classified",
  tenders: "tender",
  jobs: "job",
  articles: "article",
};

const MODULE_DETAIL_CONFIG: Partial<
  Record<ModuleKey, { tabId: string; title: string; kind: ListingMessageKind; basePath: string; fallbackPrefix: string }>
> = {
  classifieds: {
    tabId: "contacts",
    title: "Demandes recues",
    kind: "classified",
    basePath: "/petites-annonces",
    fallbackPrefix: "annonce",
  },
  jobs: {
    tabId: "candidates",
    title: "Candidats recus",
    kind: "job",
    basePath: "/offres-emploi",
    fallbackPrefix: "offre",
  },
  tenders: {
    tabId: "responses",
    title: "Reponses recues",
    kind: "tender",
    basePath: "/appels-offres",
    fallbackPrefix: "appel-offres",
  },
};

type WorkspaceListItem = {
  id: string;
  title: string;
  description: string;
  meta: string;
  messageCount?: number;
  relatedListingId?: string;
  conversationHref?: string;
  listingHref?: string;
  participantEmail?: string;
  lastMessageAt?: string;
};

function formatWorkspaceConversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getConversationPreview(content: string, attachment?: { fileName?: string }, attachments?: Array<{ fileName?: string; url?: string; mimeType?: string; sizeBytes?: number }>) {
  const plainText = extractMessagePlainText(content);
  if (plainText) {
    return plainText;
  }
  return getMessageAttachmentPreviewLabel({ attachment, attachments });
}

async function buildWorkspaceConversationItems(
  moduleKey: Exclude<ModuleKey, "articles">,
  items: Array<{ id?: string; title?: string }>,
  ownerEmail: string,
): Promise<{ primaryItems: WorkspaceListItem[]; detailItems: WorkspaceListItem[] }> {
  const config = MODULE_DETAIL_CONFIG[moduleKey];
  if (!config) {
    return { primaryItems: items as WorkspaceListItem[], detailItems: [] };
  }

  const normalizedOwnerEmail = ownerEmail.trim().toLowerCase();
  const perItemResults = await Promise.all(
    items.map(async (item) => {
      const listingId = Number.parseInt(String(item.id || "0"), 10);
      if (!Number.isFinite(listingId) || listingId <= 0) {
        return {
          primaryItem: { ...(item as WorkspaceListItem), messageCount: 0 },
          detailItems: [] as WorkspaceListItem[],
        };
      }

      const listingTitle = String(item.title || "").trim() || `Publication #${listingId}`;
      const slug = buildListingSlug(listingId, listingTitle, config.fallbackPrefix);
      const listingHref = `${config.basePath}/${slug}`;

      try {
        const messages =
          moduleKey === "classifieds" ? await getClassifiedMessages(listingId) : await getListingMessages(config.kind, listingId);
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
          const senderEmail = String(message.senderEmail || "").trim().toLowerCase();
          const recipientEmail = String(message.recipientEmail || "").trim().toLowerCase();
          const participantEmail = senderEmail === normalizedOwnerEmail ? recipientEmail : senderEmail;
          if (!participantEmail || participantEmail === normalizedOwnerEmail) {
            continue;
          }

          const participantName =
            senderEmail === participantEmail
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

        return {
          primaryItem: { ...(item as WorkspaceListItem), messageCount: messages.length },
          detailItems: Array.from(grouped.values()).map((entry) => {
            const conversationHref = `${config.basePath}/${slug}/contacter?participant=${encodeURIComponent(entry.participantEmail)}`;
            return {
              id: `${config.kind}:${listingId}:${entry.participantEmail}`,
              title: entry.participantName || entry.participantEmail,
              description: entry.lastMessage,
              meta: `${entry.messageCount} message${entry.messageCount > 1 ? "s" : ""} • ${formatWorkspaceConversationDate(entry.lastMessageAt)}` ,
              messageCount: entry.messageCount,
              relatedListingId: String(listingId),
              conversationHref,
              listingHref,
              participantEmail: entry.participantEmail,
              lastMessageAt: entry.lastMessageAt,
            } satisfies WorkspaceListItem;
          }),
        };
      } catch {
        return {
          primaryItem: { ...(item as WorkspaceListItem), messageCount: 0 },
          detailItems: [] as WorkspaceListItem[],
        };
      }
    }),
  );

  const primaryItems = perItemResults.map((entry) => entry.primaryItem);
  const detailItems = perItemResults
    .flatMap((entry) => entry.detailItems)
    .sort((left, right) => new Date(right.lastMessageAt || 0).getTime() - new Date(left.lastMessageAt || 0).getTime());

  return { primaryItems, detailItems };
}
export async function GET(request: NextRequest, { params }: { params: { module: string } }) {
  const session = getServerSession();

  if (!session?.wpUserId) {
    return workspaceResponse({ error: "Utilisateur non connecte." }, { status: 401 });
  }

  const moduleKey = params.module as ModuleKey;
  const includeDetails = request.nextUrl.searchParams.get("includeDetails") === "1";

  if (!(moduleKey in MODULE_KIND_MAP)) {
    return workspaceResponse({ error: "Module inconnu." }, { status: 404 });
  }

  if (moduleKey === "tenders") {
    const accessStatus = await getWordPressPublishingAccessStatus({ wpUserId: session.wpUserId });
    if (!accessStatus.tenders.canCreateDraft) {
      return workspaceResponse({ error: "Votre plan actuel ne permet pas de gerer les appels d'offres." }, { status: 403 });
    }
  }

  try {
    const list = await getWordPressUserWorkspaceItems(MODULE_KIND_MAP[moduleKey], {
      wpUserId: session.wpUserId,
    });

    if (moduleKey === "classifieds") {
      const conversations = includeDetails
        ? await buildWorkspaceConversationItems("classifieds", list.items || [], session.email || "")
        : { primaryItems: list.items || [], detailItems: [] };

      return workspaceResponse({
        workspace: {
          classifieds: {
            ...list,
            items: conversations.primaryItems,
          },
          ...(includeDetails ? { contacts: { title: "Demandes recues", items: conversations.detailItems } } : {}),
        },
      });
    }

    if (moduleKey === "tenders") {
      const conversations = includeDetails
        ? await buildWorkspaceConversationItems("tenders", list.items || [], session.email || "")
        : { primaryItems: list.items || [], detailItems: [] };
      return workspaceResponse({
        workspace: {
          tenders: {
            ...list,
            items: conversations.primaryItems,
          },
          ...(includeDetails ? { responses: { title: "Reponses recues", items: conversations.detailItems } } : {}),
        },
      });
    }

    if (moduleKey === "jobs") {
      const conversations = includeDetails
        ? await buildWorkspaceConversationItems("jobs", list.items || [], session.email || "")
        : { primaryItems: list.items || [], detailItems: [] };
      return workspaceResponse({
        workspace: {
          jobs: {
            ...list,
            items: conversations.primaryItems,
          },
          ...(includeDetails ? { candidates: { title: "Candidats recus", items: conversations.detailItems } } : {}),
        },
      });
    }

    return workspaceResponse({
      workspace: {
        articles: list,
      },
    });
  } catch (error) {
    console.error("[profile/workspace] unexpected error", error);
    return workspaceResponse(
      { error: "Impossible de charger cet espace pour le moment." },
      { status: 502 },
    );
  }
}
