import { buildMetadata } from "@/app/metadata";
import { notFound } from "next/navigation";
import { FeatureFollowUpPage } from "@/features/profile/components/FeatureFollowUpPage";
import { getWordPressUserWorkspaceItems } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getClassifiedMessages } from "@/lib/messages/classified-messages";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return buildMetadata("Suivi d'annonce", "Suivez les contacts recus pour cette annonce.");
}

export default async function ProfilPetiteAnnonceDetailPage({ params }: { params: { itemId: string } }) {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: `/profil/petites-annonces/${params.itemId}` });
  const wpUserId = Number.parseInt(String(session.wpUserId || "0"), 10);

  let items: Array<{
    id: string;
    title: string;
    description: string;
    meta: string;
    image?: string;
    images?: string[];
  }> = [];

  if (Number.isFinite(wpUserId) && wpUserId > 0) {
    try {
      const classifiedsList = await getWordPressUserWorkspaceItems("classified", { wpUserId });
      items = classifiedsList.items || [];
    } catch {
      items = [];
    }
  }

  const item = items.find((entry) => entry.id === params.itemId);
  if (!item) {
    notFound();
  }

  const listingId = Number.parseInt(params.itemId, 10);
  const messages = Number.isFinite(listingId) && listingId > 0 ? await getClassifiedMessages(listingId) : [];
  const entries = messages.map((message) => ({
    id: message.id,
    title: `Message de ${message.senderName || "Visiteur"}`,
    description: message.content,
    meta: `${message.senderEmail} · ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(message.createdAt))}`,
    status: message.status,
  }));

  return (
    <FeatureFollowUpPage
      eyebrow="Contacts recus"
      title="Suivi de votre annonce"
      backHref="/profil/petites-annonces"
      backLabel="Retour aux annonces"
      item={item}
      itemImageFallbackSrc="/image-placeholder.png"
      followUpLabel="Demandes et prises de contact"
      entries={entries}
    />
  );
}
