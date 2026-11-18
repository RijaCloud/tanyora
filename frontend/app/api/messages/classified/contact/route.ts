import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getWordPressPublicListings } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { appendClassifiedMessage } from "@/lib/messages/classified-messages";
import { buildListingSlug } from "@/lib/listings/slug";
import { dispatchEmail } from "@/lib/notifications/email-dispatcher";
import { getMessageNotificationEmailOptions } from "@/lib/notifications/message-email";
import { addNotification, normalizeNotificationUserKey } from "@/lib/notifications/store";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { classifiedMessageSchema } from "@/lib/security/validation";

function sanitizeMessageContent(value: unknown): string {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildConversationUrl(baseUrl: string, listingSlug: string, participantEmail?: string) {
  const url = new URL(`/petites-annonces/${listingSlug}/contacter`, baseUrl.replace(/\/$/, "") + "/");
  if (participantEmail) {
    url.searchParams.set("participant", participantEmail);
  }
  return url.toString();
}

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.wpUserId || !session.email) {
    return NextResponse.json({ error: "Connexion requise pour contacter l'annonceur." }, { status: 401 });
  }

  if (isEmailVerificationRequired(session)) {
    return NextResponse.json({ error: "Verifiez votre email avant de contacter un annonceur." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = classifiedMessageSchema.safeParse({
    listingId: Number.parseInt(String(body?.listingId || "0"), 10),
    message: sanitizeMessageContent(body?.message),
  });
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Donnees de message invalides." }, { status: 400 });
  }

  const writeRateLimit = await consumeRateLimit({
    scope: "classified-contact-write",
    subject: `${session.wpUserId}:${getClientIp(request)}`,
    limit: 12,
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
    const listingResult = await getWordPressPublicListings("classified", { id: listingId, perPage: 1 });
    const listing = listingResult.items?.[0];
    if (!listing) {
      return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    }

    const recipientEmail = String(listing.contactEmail || "").trim().toLowerCase();
    if (!recipientEmail) {
      return NextResponse.json({ error: "Cette annonce ne peut pas etre contactee pour le moment." }, { status: 400 });
    }
    if (recipientEmail === session.email.toLowerCase()) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous auto-contacter sur votre propre annonce." }, { status: 400 });
    }

    const senderName = session.name || session.username || session.email;

    const entry = {
      id: randomUUID(),
      listingId,
      senderWpUserId: session.wpUserId,
      senderName,
      senderEmail: session.email.toLowerCase(),
      recipientEmail,
      content: message,
      createdAt: new Date().toISOString(),
      status: "new" as const,
    };

    await appendClassifiedMessage(entry);

    const listingUrlBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "https://tanyora.mijary.tech";
    const listingSlug = buildListingSlug(listing.id, listing.title, "annonce");
    const conversationUrl = buildConversationUrl(listingUrlBase, listingSlug, session.email.toLowerCase());
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
          title: "Nouvelle activite sur votre annonce",
          subject: `Nouvelle activite sur votre annonce : ${listing.title}`,
          preheader: `${senderName} vous a envoye un message au sujet de ${listing.title}.`,
          introLine: "Quelqu'un a interagi avec l'une de vos annonces.",
          actorName: senderName,
          activityLabel: "vous a envoye un message au sujet de votre annonce",
          entityTitle: listing.title,
          activityTimeLabel: "A l'instant",
          ctaLabel: "Voir le message",
          ctaUrl: conversationUrl,
          siteUrl: listingUrlBase,
          preferencesUrl: emailOptions.preferencesUrl,
          unsubscribeUrl: emailOptions.unsubscribeUrl,
        },
        metadata: {
          channel: "classifieds",
          flow: "contact",
          listingId: String(listingId),
          senderWpUserId: String(session.wpUserId),
        },
      });

      if (!dispatchResult.ok) {
        console.error("[messages/classified/contact] email dispatch failed", {
          recipientEmail,
          listingId,
          error: dispatchResult.message,
          status: dispatchResult.status,
        });
      }
    }

    await addNotification(normalizeNotificationUserKey(recipientEmail), {
      id: entry.id,
      kind: "message",
      title: `Nouveau message pour "${listing.title}"`,
      body: `${senderName} vous a envoye un message au sujet de votre annonce.`,
      href: conversationUrl,
      createdAt: entry.createdAt,
      metadata: {
        listingId: String(listingId),
        channel: "classifieds",
      },
    });

    return NextResponse.json({ ok: true, messageId: entry.id });
  } catch (error) {
    console.error("[messages/classified/contact] unexpected error", error);
    return NextResponse.json(
      { error: "Impossible d'envoyer votre message pour le moment." },
      { status: 502 },
    );
  }
}
