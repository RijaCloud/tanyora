import { buildMetadata } from "@/app/metadata";
import { notFound } from "next/navigation";
import { FeatureFollowUpPage } from "@/features/profile/components/FeatureFollowUpPage";
import { getWordPressUserWorkspaceItems } from "@/lib/api/wordpress-internal";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getServerSession } from "@/lib/auth/session";
import { buildListingSlug } from "@/lib/listings/slug";
import { getListingMessages } from "@/lib/messages/listing-messages";
import { buildFollowUpEntriesFromMessages } from "@/lib/messages/profile-follow-up";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return buildMetadata("Suivi d'offre", "Suivez les candidatures reçues pour cette offre.");
}

export default async function ProfilOffreEmploiDetailPage({ params }: { params: { itemId: string } }) {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: `/profil/offres-emploi/${params.itemId}` });
  const wpUserId = Number.parseInt(String(session.wpUserId || "0"), 10);
  const list =
    Number.isFinite(wpUserId) && wpUserId > 0
      ? await getWordPressUserWorkspaceItems("job", { wpUserId }).catch(() => ({ title: "Mes offres", items: [] }))
      : { title: "Mes offres", items: [] };
  const item = (list.items || []).find((entry) => entry.id === params.itemId);
  if (!item) {
    notFound();
  }

  const listingId = Number.parseInt(params.itemId, 10);
  const messages = Number.isFinite(listingId) && listingId > 0 ? await getListingMessages("job", listingId) : [];
  const listingSlug = buildListingSlug(listingId, item.title, "offre");
  const entries = buildFollowUpEntriesFromMessages({
    messages,
    kind: "job",
    listingSlug,
    titlePrefix: "Candidature de",
    ownerEmail: String(session.email || ""),
  });

  return (
    <FeatureFollowUpPage
      eyebrow="Candidats"
      title="Suivi de votre offre d'emploi"
      backHref="/profil/offres-emploi"
      backLabel="Retour aux offres"
      item={item}
      followUpLabel="Candidatures et profils reçus"
      entries={entries}
    />
  );
}
