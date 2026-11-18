import { buildMetadata } from "@/app/metadata";
import { notFound, redirect } from "next/navigation";
import { FeatureFollowUpPage } from "@/features/profile/components/FeatureFollowUpPage";
import { getWordPressPublishingAccessStatus, getWordPressUserWorkspaceItems } from "@/lib/api/wordpress-internal";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getServerSession } from "@/lib/auth/session";
import { buildListingSlug } from "@/lib/listings/slug";
import { getListingMessages } from "@/lib/messages/listing-messages";
import { buildFollowUpEntriesFromMessages } from "@/lib/messages/profile-follow-up";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return buildMetadata("Suivi d'appel d'offres", "Suivez les réponses reçues pour cet appel d'offres.");
}

export default async function ProfilAppelOffreDetailPage({ params }: { params: { itemId: string } }) {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: `/profil/appels-offres/${params.itemId}` });
  const publishingAccessStatus = await getWordPressPublishingAccessStatus({ wpUserId: Number(session.wpUserId || 0) }).catch(() => null);
  if (!publishingAccessStatus?.tenders?.canCreateDraft) {
    redirect("/tarifs");
  }

  const wpUserId = Number.parseInt(String(session.wpUserId || "0"), 10);
  const list =
    Number.isFinite(wpUserId) && wpUserId > 0
      ? await getWordPressUserWorkspaceItems("tender", { wpUserId }).catch(() => ({ title: "Mes appels d'offres", items: [] }))
      : { title: "Mes appels d'offres", items: [] };
  const item = (list.items || []).find((entry) => entry.id === params.itemId);
  if (!item) {
    notFound();
  }

  const listingId = Number.parseInt(params.itemId, 10);
  const messages = Number.isFinite(listingId) && listingId > 0 ? await getListingMessages("tender", listingId) : [];
  const listingSlug = buildListingSlug(listingId, item.title, "appel-offres");
  const entries = buildFollowUpEntriesFromMessages({
    messages,
    kind: "tender",
    listingSlug,
    titlePrefix: "Réponse de",
    ownerEmail: String(session.email || ""),
  });

  return (
    <FeatureFollowUpPage
      eyebrow="Réponses"
      title="Suivi de votre appel d'offres"
      backHref="/profil/appels-offres"
      backLabel="Retour aux appels d'offres"
      item={item}
      followUpLabel="Réponses et propositions reçues"
      entries={entries}
    />
  );
}
