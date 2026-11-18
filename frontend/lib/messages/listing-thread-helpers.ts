import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getWordPressPublicListings, getWordPressUserProfile } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { buildListingSlug } from "@/lib/listings/slug";
import { getMessageAttachmentPreviewLabel, normalizeMessageAttachments } from "@/lib/messages/attachments";
import { appendListingMessage, getListingMessages, type ListingMessageKind } from "@/lib/messages/listing-messages";
import { extractMessagePlainText } from "@/lib/messages/message-content";
import { dispatchEmail } from "@/lib/notifications/email-dispatcher";
import { getMessageNotificationEmailOptions } from "@/lib/notifications/message-email";
import { addNotification, markMessageNotificationsRead, normalizeNotificationUserKey } from "@/lib/notifications/store";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { listingMessageSchema } from "@/lib/security/validation";

type KindConfig = {
  kind: ListingMessageKind;
  basePath: string;
  fallbackPrefix: string;
  ownerLabel: string;
};

function sanitizeMessageContent(value: unknown): string {
  return String(value || "").trim();
}

function sanitizeParticipantEmail(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function getOwnerConversationParticipants(
  messages: Awaited<ReturnType<typeof getListingMessages>>,
  ownerEmail: string,
) {
  return new Set(
    messages
      .flatMap((message) => [message.senderEmail, message.recipientEmail])
      .map((email) => sanitizeParticipantEmail(email))
      .filter((email) => email && email !== ownerEmail),
  );
}

function buildConversationUrl(baseUrl: string, config: KindConfig, listingSlug: string, participantEmail?: string) {
  const url = new URL(`${config.basePath}/${listingSlug}/contacter`, baseUrl.replace(/\/$/, "") + "/");
  if (participantEmail) {
    url.searchParams.set("participant", participantEmail);
  }
  return url.toString();
}

function buildCurrentDisplayName(profile: Awaited<ReturnType<typeof getWordPressUserProfile>> | null | undefined): string {
  if (!profile) {
    return "";
  }

  const firstName = String(profile.firstName || "").trim();
  const lastName = String(profile.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  return String(profile.displayName || "").trim();
}

async function resolveParticipantDisplayName(
  participantWpUserId: number,
  fallbackName: string | null | undefined,
): Promise<string | null> {
  if (participantWpUserId > 0) {
    try {
      const profile = await getWordPressUserProfile({ wpUserId: participantWpUserId });
      const currentName = buildCurrentDisplayName(profile);
      if (currentName) {
        return currentName;
      }
    } catch (error) {
      console.warn("[messages/thread] unable to refresh participant display name", {
        participantWpUserId,
        error,
      });
    }
  }

  const normalizedFallback = String(fallbackName || "").trim();
  return normalizedFallback || null;
}

async function resolveListing(config: KindConfig, listingId: number) {
  const listingResult = await getWordPressPublicListings(config.kind, { id: listingId, perPage: 1 });
  const listing = listingResult.items?.[0];
  if (!listing) {
    return null;
  }

  const ownerEmail = String(listing.ownerEmail || listing.contactEmail || "").trim().toLowerCase();
  const ownerWpUserId = Number.isFinite(Number(listing.ownerWpUserId)) ? Number(listing.ownerWpUserId) : 0;
  if (!ownerEmail) {
    return null;
  }

  return {
    listing,
    ownerEmail,
    ownerWpUserId,
  };
}

export function createListingThreadHandlers(config: KindConfig) {
  async function GET(request: NextRequest) {
    const session = getServerSession();
    if (!session?.email) {
      return NextResponse.json({ error: "Connexion requise pour acceder a la conversation." }, { status: 401 });
    }

    if (isEmailVerificationRequired(session)) {
      return NextResponse.json({ error: "Verifiez votre email avant d'acceder a la messagerie." }, { status: 403 });
    }

    const listingId = Number.parseInt(request.nextUrl.searchParams.get("listingId") || "0", 10);
    if (!Number.isFinite(listingId) || listingId <= 0) {
      return NextResponse.json({ error: "Publication invalide." }, { status: 400 });
    }

    const readRateLimit = await consumeRateLimit({
      scope: `${config.kind}-thread-read`,
      subject: `${session.wpUserId || "anon"}:${getClientIp(request)}`,
      limit: 180,
      windowSeconds: 60,
    });
    if (!readRateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requetes. Merci de patienter quelques secondes." },
        { status: 429, headers: { "Retry-After": String(readRateLimit.retryAfterSeconds) } },
      );
    }

    try {
      const resolved = await resolveListing(config, listingId);
      if (!resolved) {
        return NextResponse.json({ error: "Publication introuvable ou indisponible." }, { status: 404 });
      }

      const viewerEmail = session.email.toLowerCase();
      const ownerEmail = resolved.ownerEmail;
      const viewerIsOwner = Boolean(session.wpUserId) && session.wpUserId === resolved.ownerWpUserId;
      const requestedParticipantEmail = sanitizeParticipantEmail(request.nextUrl.searchParams.get("participant"));
      const allMessages = await getListingMessages(config.kind, listingId);
      const ownerParticipants = getOwnerConversationParticipants(allMessages, ownerEmail);
      const participantEmail =
        viewerIsOwner
          ? requestedParticipantEmail ||
            (() => {
              const participants = Array.from(ownerParticipants);
              return participants.length === 1 ? participants[0] : "";
            })()
          : viewerEmail;

      if (viewerIsOwner && !participantEmail) {
        return NextResponse.json(
          { error: "Choisissez une conversation depuis le lien recu par email pour repondre a ce contact." },
          { status: 400 },
        );
      }

      if (viewerIsOwner && !ownerParticipants.has(participantEmail)) {
        return NextResponse.json(
          { error: "Cette conversation n'est pas accessible depuis ce compte." },
          { status: 403 },
        );
      }

      const filtered = allMessages
        .filter((message) => {
          if (viewerIsOwner) {
            return (
              (message.senderEmail === ownerEmail && message.recipientEmail === participantEmail) ||
              (message.senderEmail === participantEmail && message.recipientEmail === ownerEmail)
            );
          }

          return (
            (message.senderEmail === viewerEmail && message.recipientEmail === ownerEmail) ||
            (message.senderEmail === ownerEmail && message.recipientEmail === viewerEmail)
          );
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((message) => ({
          ...message,
          isMine: message.senderEmail === viewerEmail,
        }));

      const fallbackParticipantName =
        filtered.find((message) => message.senderEmail === participantEmail)?.senderName ||
        filtered.find((message) => message.recipientEmail === participantEmail)?.senderName ||
        null;
      const participantWpUserId = viewerIsOwner
        ? filtered.find((message) => message.senderEmail === participantEmail && message.senderWpUserId > 0)?.senderWpUserId || 0
        : resolved.ownerWpUserId;
      const participantName = await resolveParticipantDisplayName(participantWpUserId, fallbackParticipantName);

      const listingSlug = buildListingSlug(resolved.listing.id, resolved.listing.title, config.fallbackPrefix);
      const listingUrlBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "https://tanyora.mijary.tech";
      const conversationHref = buildConversationUrl(
        listingUrlBase,
        config,
        listingSlug,
        viewerIsOwner ? participantEmail || undefined : viewerEmail,
      );

      await markMessageNotificationsRead(normalizeNotificationUserKey(viewerEmail), {
        listingId: String(listingId),
        channel: config.kind,
        href: conversationHref,
      });

      return NextResponse.json({
        ok: true,
        messages: filtered,
        participantEmail: participantEmail || null,
        participantName,
      });
    } catch (error) {
      console.error(`[messages/${config.kind}/thread][GET] unexpected error`, error);
      return NextResponse.json({ error: "Impossible de charger la conversation." }, { status: 502 });
    }
  }

  async function POST(request: NextRequest) {
    const session = getServerSession();
    if (!session?.wpUserId || !session.email) {
      return NextResponse.json({ error: "Connexion requise pour envoyer un message." }, { status: 401 });
    }

    if (isEmailVerificationRequired(session)) {
      return NextResponse.json({ error: "Verifiez votre email avant d'envoyer un message." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsedBody = listingMessageSchema.safeParse({
      listingId: Number.parseInt(String(body?.listingId || "0"), 10),
      message: sanitizeMessageContent(body?.message),
      recipientEmail: body?.recipientEmail,
      attachment: body?.attachment,
      attachments: body?.attachments,
    });
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Donnees de message invalides." }, { status: 400 });
    }

    const writeRateLimit = await consumeRateLimit({
      scope: `${config.kind}-thread-write`,
      subject: `${session.wpUserId}:${getClientIp(request)}`,
      limit: 20,
      windowSeconds: 60,
    });
    if (!writeRateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop d'envois. Merci de patienter une minute." },
        { status: 429, headers: { "Retry-After": String(writeRateLimit.retryAfterSeconds) } },
      );
    }

    try {
      const { listingId, message } = parsedBody.data;
      const resolved = await resolveListing(config, listingId);
      if (!resolved) {
        return NextResponse.json({ error: "Publication introuvable ou indisponible." }, { status: 404 });
      }

      const viewerEmail = session.email.toLowerCase();
      const ownerEmail = resolved.ownerEmail;
      const viewerIsOwner = Boolean(session.wpUserId) && session.wpUserId === resolved.ownerWpUserId;
      const requestedRecipientEmail = sanitizeParticipantEmail(parsedBody.data.recipientEmail);
      const recipientEmail = viewerIsOwner ? requestedRecipientEmail : ownerEmail;
      const allMessages = await getListingMessages(config.kind, listingId);
      const ownerParticipants = getOwnerConversationParticipants(allMessages, ownerEmail);

      if (!recipientEmail || recipientEmail === viewerEmail) {
        return NextResponse.json({ error: "Destinataire invalide." }, { status: 400 });
      }

      if (viewerIsOwner && !ownerParticipants.has(recipientEmail)) {
        return NextResponse.json(
          { error: "Cette conversation n'est pas accessible depuis ce compte." },
          { status: 403 },
        );
      }

      const senderName = session.name || session.username || session.email;
      const attachments = normalizeMessageAttachments(parsedBody.data);
      const newMessage = {
        id: randomUUID(),
        kind: config.kind,
        listingId,
        senderWpUserId: session.wpUserId,
        senderName,
        senderEmail: viewerEmail,
        recipientEmail,
        content: message,
        attachment: attachments[0],
        attachments,
        createdAt: new Date().toISOString(),
        status: "new" as const,
      };

      await appendListingMessage(newMessage);

      const listingUrlBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "https://tanyora.mijary.tech";
      const listingSlug = buildListingSlug(resolved.listing.id, resolved.listing.title, config.fallbackPrefix);
      const listingUrl = buildConversationUrl(
        listingUrlBase,
        config,
        listingSlug,
        recipientEmail === ownerEmail ? viewerEmail : undefined,
      );
      const recipientIsOwner = recipientEmail === ownerEmail;
      const emailOptions = await getMessageNotificationEmailOptions({
        recipientEmail,
        siteUrl: listingUrlBase,
      });

      if (emailOptions.shouldSendEmail) {
        const dispatchResult = await dispatchEmail({
          eventName: "notification.activity.v1",
          recipient: {
            email: recipientEmail,
            name: senderName,
          },
          templateData: {
            title: recipientIsOwner ? "Nouvelle activite sur votre annonce" : "Nouvelle reponse dans votre conversation",
            subject: recipientIsOwner
              ? `Nouvelle activite sur votre annonce : ${resolved.listing.title}`
              : `Nouvelle reponse dans votre conversation : ${resolved.listing.title}`,
            preheader: recipientIsOwner
              ? `${senderName} vous a envoye un message au sujet de ${resolved.listing.title}.`
              : `${senderName} a repondu a votre conversation au sujet de ${resolved.listing.title}.`,
            introLine: recipientIsOwner
              ? "Quelqu'un a interagi avec l'une de vos annonces."
              : "Vous avez recu une nouvelle reponse a l'un de vos messages.",
            actorName: senderName,
            activityLabel: recipientIsOwner ? "vous a envoye un message au sujet de votre annonce" : "a repondu a votre conversation au sujet de",
            entityTitle: resolved.listing.title,
            activityTimeLabel: "A l'instant",
            ctaLabel: "Voir le message",
            ctaUrl: listingUrl,
            siteUrl: listingUrlBase,
            preferencesUrl: emailOptions.preferencesUrl,
            unsubscribeUrl: emailOptions.unsubscribeUrl,
          },
          metadata: {
            channel: config.kind,
            flow: "thread",
            listingId: String(listingId),
            senderWpUserId: String(session.wpUserId),
          },
        });

        if (!dispatchResult.ok) {
          console.error(`[messages/${config.kind}/thread] email dispatch failed`, {
            recipientEmail,
            listingId,
            error: dispatchResult.message,
            status: dispatchResult.status,
          });
        }
      }

      const notificationMessagePreview = extractMessagePlainText(message) || getMessageAttachmentPreviewLabel({ attachments });

      await addNotification(normalizeNotificationUserKey(recipientEmail), {
        id: newMessage.id,
        kind: "message",
        title: `Nouveau message pour "${resolved.listing.title}"`,
        body: recipientIsOwner
          ? notificationMessagePreview
            ? `${senderName} vous a envoye un message : ${notificationMessagePreview}`
            : `${senderName} vous a envoye un message au sujet de votre publication.`
          : notificationMessagePreview
            ? `${senderName} a repondu : ${notificationMessagePreview}`
            : `${senderName} a repondu a votre conversation.`,
        href: listingUrl,
        createdAt: newMessage.createdAt,
        metadata: {
          listingId: String(listingId),
          channel: config.kind,
        },
      });

      return NextResponse.json({
        ok: true,
        message: {
          ...newMessage,
          isMine: true,
        },
      });
    } catch (error) {
      console.error(`[messages/${config.kind}/thread][POST] unexpected error`, error);
      return NextResponse.json({ error: "Impossible d'envoyer votre message pour le moment." }, { status: 502 });
    }
  }

  return { GET, POST };
}
