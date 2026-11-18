import { NextRequest, NextResponse } from "next/server";
import {
  getWordPressCurrentUserRating,
  getWordPressPublicListings,
  getWordPressUserRatingSummary,
  invalidatePublicWordPressCache,
  upsertWordPressUserRating,
} from "@/lib/api/wordpress-internal";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { getServerSession } from "@/lib/auth/session";
import { getListingMessages } from "@/lib/messages/listing-messages";

function normalizeEmail(value: string | undefined | null) {
  return String(value || "").trim().toLowerCase();
}

function buildThreadKey(listingId: number, leftEmail: string, rightEmail: string) {
  const participants = [normalizeEmail(leftEmail), normalizeEmail(rightEmail)].filter(Boolean).sort();
  return `classified:${listingId}:${participants.join(":")}`;
}

async function resolveEligibility(listingId: number, viewerEmail?: string | null, viewerWpUserId?: number | null) {
  const result = await getWordPressPublicListings("classified", { id: listingId, perPage: 1 });
  const listing = result.items[0];
  if (!listing) {
    return null;
  }

  const ownerEmail = normalizeEmail(listing.ownerEmail || listing.contactEmail);
  const ownerWpUserId = Number(listing.ownerWpUserId || 0);
  const normalizedViewerEmail = normalizeEmail(viewerEmail);
  const isOwner = Boolean(viewerWpUserId && ownerWpUserId && viewerWpUserId === ownerWpUserId);
  const messages = normalizedViewerEmail && ownerEmail ? await getListingMessages("classified", listingId) : [];
  const hasConversation = messages.some((message) => {
    const sender = normalizeEmail(message.senderEmail);
    const recipient = normalizeEmail(message.recipientEmail);
    return (
      (sender === normalizedViewerEmail && recipient === ownerEmail) ||
      (sender === ownerEmail && recipient === normalizedViewerEmail)
    );
  });

  return {
    listing,
    ownerEmail,
    ownerWpUserId,
    canRate: Boolean(normalizedViewerEmail && viewerWpUserId && !isOwner && hasConversation),
    isOwner,
  };
}

export async function GET(request: NextRequest) {
  const listingId = Number.parseInt(request.nextUrl.searchParams.get("listingId") || "0", 10);
  if (!Number.isFinite(listingId) || listingId <= 0) {
    return NextResponse.json({ error: "Identifiant annonce invalide." }, { status: 400 });
  }

  const session = getServerSession();
  const resolved = await resolveEligibility(listingId, session?.email, session?.wpUserId);
  if (!resolved) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }

  const ratingSummary = resolved.ownerWpUserId
    ? await getWordPressUserRatingSummary({ sellerUserId: resolved.ownerWpUserId }).catch(() => ({
        average: Number(resolved.listing.ownerRatingAverage || 0),
        count: Number(resolved.listing.ownerRatingCount || 0),
      }))
    : {
        average: 0,
        count: 0,
      };

  const currentRating =
    resolved.ownerWpUserId && session?.wpUserId
      ? await getWordPressCurrentUserRating({
          sellerUserId: resolved.ownerWpUserId,
          raterUserId: session.wpUserId,
          listingId,
        }).catch(() => ({
          hasRated: false,
          ratingId: 0,
          score: 0,
        }))
      : {
          hasRated: false,
          ratingId: 0,
          score: 0,
        };

  return NextResponse.json({
    canRate: resolved.canRate,
    isOwner: resolved.isOwner,
    hasRated: Boolean(currentRating.hasRated),
    currentScore: Number(currentRating.score || 0),
    ownerRatingAverage: Number(ratingSummary.average || 0),
    ownerRatingCount: Number(ratingSummary.count || 0),
  });
}

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.wpUserId || !session.email) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  if (isEmailVerificationRequired(session)) {
    return NextResponse.json({ error: "Vérifiez votre email avant de noter un annonceur." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { listingId?: number; score?: number } | null;
  const listingId = Number(body?.listingId || 0);
  const score = Number(body?.score || 0);
  if (!Number.isFinite(listingId) || listingId <= 0 || !Number.isFinite(score) || score < 1 || score > 5) {
    return NextResponse.json({ error: "Paramètres de note invalides." }, { status: 400 });
  }

  const resolved = await resolveEligibility(listingId, session.email, session.wpUserId);
  if (!resolved) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }

  if (!resolved.canRate) {
    return NextResponse.json({ error: "La note est disponible uniquement après un échange de messagerie avec cet annonceur." }, { status: 403 });
  }

  const currentRating = await getWordPressCurrentUserRating({
    sellerUserId: resolved.ownerWpUserId,
    raterUserId: session.wpUserId,
    listingId,
  }).catch(() => ({
    hasRated: false,
    ratingId: 0,
    score: 0,
  }));

  if (currentRating.hasRated) {
    return NextResponse.json(
      {
        error: "Vous avez déjà noté cet annonceur.",
        hasRated: true,
        currentScore: Number(currentRating.score || 0),
      },
      { status: 409 },
    );
  }

  const rating = await upsertWordPressUserRating({
    sellerUserId: resolved.ownerWpUserId,
    raterUserId: session.wpUserId,
    listingId,
    score,
    threadKey: buildThreadKey(listingId, session.email, resolved.ownerEmail),
  });

  await Promise.all([
    invalidatePublicWordPressCache("classified"),
    invalidatePublicWordPressCache("job"),
    invalidatePublicWordPressCache("tender"),
  ]);

  return NextResponse.json({
    ok: true,
    hasRated: true,
    ownerRatingAverage: Number(rating.average || 0),
    ownerRatingCount: Number(rating.count || 0),
    score: Number(rating.score || score),
  });
}
