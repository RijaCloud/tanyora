import { buildMetadata } from "@/app/metadata";
import ClassifiedConversationPage from "@/features/prototype/components/ClassifiedConversationPage";
import { getWordPressPublicListings } from "@/lib/api/wordpress-internal";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getServerSession } from "@/lib/auth/session";
import { buildListingSlug, extractListingIdFromSlug } from "@/lib/listings/slug";
import { getListingMessages } from "@/lib/messages/listing-messages";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";
import { notFound, redirect } from "next/navigation";

function formatSidebarDate(value?: string) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

async function resolveTender(paramValue: string) {
  const listingId = extractListingIdFromSlug(paramValue);
  if (!listingId) {
    return null;
  }

  const result = await getWordPressPublicListings("tender", { id: listingId, perPage: 1 });
  const source = result.items[0];
  if (!source) {
    return null;
  }

  const slug = buildListingSlug(source.id, source.title, "appel-offres");
  return { source, slug };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resolved = await resolveTender(id);
  const source = resolved?.source;
  if (!source) {
    return buildMetadata("Conversation appel d'offres introuvable", "Cet appel d'offres n'est plus disponible.", { noIndex: true });
  }

  return buildMetadata(`Contacter l'organisation - ${source.title}`, `Discutez au sujet de ${source.title}.`, { noIndex: true });
}

export default async function TenderConversationRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ participant?: string }>;
}) {
  const { id } = await params;
  const { participant } = await searchParams;
  const resolved = await resolveTender(id);
  if (!resolved) {
    notFound();
  }

  const session = requireAuthenticatedUser(getServerSession(), {
    returnTo: `/appels-offres/${resolved.slug}/contacter${participant ? `?participant=${encodeURIComponent(participant)}` : ""}`,
  });
  const ownerEmail = String(resolved.source.ownerEmail || resolved.source.contactEmail || "").trim().toLowerCase();
  const viewerEmail = String(session?.email || "").trim().toLowerCase();
  const ownerWpUserId = Number(resolved.source.ownerWpUserId || 0);
  const isOwner =
    (Number.isFinite(ownerWpUserId) && ownerWpUserId > 0 && session?.wpUserId === ownerWpUserId) ||
    Boolean(ownerEmail && viewerEmail && ownerEmail === viewerEmail);

  if (isOwner) {
    const normalizedParticipant = String(participant || "").trim().toLowerCase();
    if (!normalizedParticipant) {
      redirect(`/profil/messages?listingId=${resolved.source.id}`);
    }

    const threadMessages = await getListingMessages("tender", resolved.source.id);
    const isAllowedParticipant = threadMessages.some((message) => {
      const sender = String(message.senderEmail || "").trim().toLowerCase();
      const recipient = String(message.recipientEmail || "").trim().toLowerCase();
      return (
        (sender === ownerEmail && recipient === normalizedParticipant) ||
        (sender === normalizedParticipant && recipient === ownerEmail)
      );
    });

    if (!isAllowedParticipant) {
      redirect(`/profil/messages?listingId=${resolved.source.id}`);
    }
  }

  if (!isOwner && session && session.emailVerified === false) {
    redirect(`/appels-offres/${resolved.slug}?verificationRequired=1`);
  }

  if (id !== resolved.slug) {
    const participantQuery = participant ? `?participant=${encodeURIComponent(participant)}` : "";
    redirect(`/appels-offres/${resolved.slug}/contacter${participantQuery}`);
  }

  const deadline = formatSidebarDate(resolved.source.expiresAt || resolved.source.deadline);
  const listing = {
    id: resolved.source.id,
    slug: resolved.slug,
    title: resolved.source.title,
    seller: resolved.source.companyName || resolved.source.publisherName || "Publication Tanyora",
    image: resolved.source.companyLogo || undefined,
    location: resolved.source.location || "Madagascar",
    price: formatListingMoney(resolved.source.budget || "", resolved.source.currency || ""),
    ownerRatingAverage: Number(resolved.source.ownerRatingAverage || 0),
    ownerRatingCount: Number(resolved.source.ownerRatingCount || 0),
    sidebarEyebrow: "Appel d'offres",
    details: [
      { label: "Organisation", value: resolved.source.companyName || resolved.source.publisherName || "Publication Tanyora" },
      { label: "Catégorie", value: resolved.source.category || "-" },
      { label: "Budget", value: formatListingMoney(resolved.source.budget || "", resolved.source.currency || "") || "-" },
      { label: "Lieu", value: resolved.source.location || "Madagascar" },
      ...(deadline ? [{ label: "Date limite", value: deadline }] : []),
    ],
  };

  return (
    <ClassifiedConversationPage
      kind="tender"
      listing={listing}
      isOwner={isOwner}
      participantEmail={isOwner ? String(participant || "").trim().toLowerCase() : viewerEmail || undefined}
      ownerEditHref="/profil/appels-offres"
      canStartConversation={Boolean(ownerEmail)}
      sellerListingsHref={
        Number(resolved.source.ownerWpUserId || 0) > 0
          ? `/appels-offres?ownerWpUserId=${Number(resolved.source.ownerWpUserId || 0)}&company=${encodeURIComponent(resolved.source.companyName || resolved.source.publisherName || "Organisation")}`
          : undefined
      }
      sellerListingsLabel="Voir les autres appels d'offres de cet annonceur"
      backHref={`/appels-offres/${resolved.slug}`}
      backLabel="Retour à l'appel d'offres"
      title="Contacter l'organisation"
      intro="Messagerie privée au sujet de cet appel d'offres. Vous recevrez aussi une notification par email pour suivre les réponses."
      ownerEntityLabel="Organisation"
    />
  );
}

