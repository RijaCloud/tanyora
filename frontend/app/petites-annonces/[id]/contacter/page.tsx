import { buildMetadata } from "@/app/metadata";
import ClassifiedConversationPage from "@/features/prototype/components/ClassifiedConversationPage";
import { getWordPressPublicListings } from "@/lib/api/wordpress-internal";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getServerSession } from "@/lib/auth/session";
import { buildListingSlug, extractListingIdFromSlug } from "@/lib/listings/slug";
import { getListingMessages } from "@/lib/messages/listing-messages";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";
import { notFound, permanentRedirect, redirect } from "next/navigation";

type ParamsShape = { id: string };
type SearchParamsShape = { participant?: string };

async function resolveClassifiedByParam(paramValue: string) {
  const listingId = extractListingIdFromSlug(paramValue);
  if (!listingId) {
    return null;
  }

  const result = await getWordPressPublicListings("classified", { id: listingId, perPage: 1 });
  const source = result.items[0];
  if (!source) {
    return null;
  }

  const slug = buildListingSlug(source.id, source.title, "annonce");
  return { source, slug };
}

export async function generateMetadata({ params }: { params: Promise<ParamsShape> }) {
  const { id: rawParam } = await params;
  const resolved = await resolveClassifiedByParam(rawParam);

  if (!resolved) {
    return buildMetadata("Conversation annonce introuvable", "Cette annonce n'est plus disponible.", { noIndex: true });
  }

  return buildMetadata(
    `Contacter ${resolved.source.companyName || "l'annonceur"} - ${resolved.source.title}`,
    `Discutez avec l'annonceur pour ${resolved.source.title}.`,
    { noIndex: true },
  );
}

export default async function ClassifiedConversationRoute({
  params,
  searchParams,
}: {
  params: Promise<ParamsShape>;
  searchParams: Promise<SearchParamsShape>;
}) {
  const { id: rawParam } = await params;
  const { participant } = await searchParams;
  const resolved = await resolveClassifiedByParam(rawParam);
  if (!resolved) {
    notFound();
  }

  if (rawParam !== resolved.slug) {
    const redirectUrl = participant
      ? `/petites-annonces/${resolved.slug}/contacter?participant=${encodeURIComponent(participant)}`
      : `/petites-annonces/${resolved.slug}/contacter`;
    permanentRedirect(redirectUrl);
  }

  const source = resolved.source;
  const session = requireAuthenticatedUser(getServerSession(), {
    returnTo: `/petites-annonces/${resolved.slug}/contacter${participant ? `?participant=${encodeURIComponent(participant)}` : ""}`,
  });
  const ownerEmail = String(source.ownerEmail || source.contactEmail || "").trim().toLowerCase();
  const viewerEmail = String(session?.email || "").trim().toLowerCase();
  const ownerWpUserId = Number(source.ownerWpUserId || 0);
  const isOwner =
    (Number.isFinite(ownerWpUserId) && ownerWpUserId > 0 && session?.wpUserId === ownerWpUserId) ||
    Boolean(ownerEmail && viewerEmail && ownerEmail === viewerEmail);

  if (isOwner) {
    const normalizedParticipant = String(participant || "").trim().toLowerCase();
    if (!normalizedParticipant) {
      redirect(`/profil/messages?listingId=${source.id}`);
    }

    const threadMessages = await getListingMessages("classified", source.id);
    const isAllowedParticipant = threadMessages.some((message) => {
      const sender = String(message.senderEmail || "").trim().toLowerCase();
      const recipient = String(message.recipientEmail || "").trim().toLowerCase();
      return (
        (sender === ownerEmail && recipient === normalizedParticipant) ||
        (sender === normalizedParticipant && recipient === ownerEmail)
      );
    });

    if (!isAllowedParticipant) {
      redirect(`/profil/messages?listingId=${source.id}`);
    }
  }

  if (!isOwner && session && session.emailVerified === false) {
    redirect(`/petites-annonces/${resolved.slug}?verificationRequired=1`);
  }

  const listing = {
    id: source.id,
    slug: resolved.slug,
    title: source.title,
    seller: source.companyName || source.publisherName || "Publié sur Tanyora",
    image: source.companyLogo || source.profilePhoto || undefined,
    location: source.location || "Madagascar",
    price: formatListingMoney(source.price || "", source.currency || ""),
    ownerRatingAverage: Number(source.ownerRatingAverage || 0),
    ownerRatingCount: Number(source.ownerRatingCount || 0),
  };

  return (
    <ClassifiedConversationPage
      listing={listing}
      isOwner={isOwner}
      participantEmail={isOwner ? String(participant || "").trim().toLowerCase() : viewerEmail || undefined}
      ownerEditHref="/profil/petites-annonces"
      canStartConversation={Boolean(String(source.contactEmail || "").trim())}
      sellerListingsHref={
        Number(source.ownerWpUserId || 0) > 0
          ? `/petites-annonces?ownerWpUserId=${Number(source.ownerWpUserId || 0)}&company=${encodeURIComponent(source.companyName || source.publisherName || "Annonceur")}`
          : undefined
      }
      sellerListingsLabel="Voir les autres annonces de cet annonceur"
    />
  );
}

