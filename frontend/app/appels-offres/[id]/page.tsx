import { buildMetadata, toPlainText } from "@/app/metadata";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";
import PublicListingDetailPage from "@/features/prototype/components/PublicListingDetailPage";
import { getWordPressPublicListings } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { buildListingSlug, extractListingIdFromSlug } from "@/lib/listings/slug";
import { notFound, permanentRedirect } from "next/navigation";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

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
    return buildMetadata("Appel d'offres introuvable", "Cet appel d'offres n'est plus disponible.", { path: `/appels-offres/${encodeURIComponent(id)}`, noIndex: true });
  }

  return buildMetadata(
    source.title,
    toPlainText(source.description || source.content || `Consultez l'appel d'offres ${source.title} publie par ${source.companyName || "Organisation"}.`),
    {
      path: `/appels-offres/${resolved!.slug}`,
      image: source.companyLogo || source.image || source.images?.[0],
      type: "article",
      publishedTime: source.date,
      modifiedTime: source.lastModified,
    },
  );
}

export default async function AppelOffresDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resolved = await resolveTender(id);
  if (!resolved) {
    notFound();
  }

  if (id !== resolved.slug) {
    permanentRedirect(`/appels-offres/${resolved.slug}`);
  }

  const { source } = resolved;
  const session = getServerSession();
  const isOwner =
    Boolean(session?.wpUserId) &&
    Number(source.ownerWpUserId || 0) > 0 &&
    Number(source.ownerWpUserId || 0) === Number(session?.wpUserId || 0);
  const item = {
    id: source.id,
    slug: resolved.slug,
    organization: source.companyName || "Organisation",
    organizationLetter: (source.companyName || "O").slice(0, 1).toUpperCase(),
    organizationColor: "#27624f",
    profilePhoto: source.companyLogo || "",
    location: source.location || "Madagascar",
    title: source.title,
    description: source.content || source.description,
    budget: source.budget || "",
    currency: source.currency || "MGA",
    deadline: source.deadline || "",
    detailsPdfUrl: source.detailsPdfUrl || "",
    detailsPdfName: source.detailsPdfName || "",
    category: source.category || "Autres",
    type: source.type || "Projet",
    contact: source.contactPhone || "",
    email: source.contactEmail || "",
    ownerWpUserId: source.ownerWpUserId || 0,
    ownerRatingAverage: Number(source.ownerRatingAverage || 0),
    ownerRatingCount: Number(source.ownerRatingCount || 0),
  };

  const relatedResult = item.category
    ? await getWordPressPublicListings("tender", {
        page: 1,
        perPage: 7,
        category: item.category,
      }).catch(() => null)
    : null;
  const relatedTenders = (relatedResult?.items || []).filter((entry) => entry.id !== item.id);

  const toSimilarTenderItem = (entry: (typeof relatedTenders)[number]) => ({
    id: entry.id,
    slug: buildListingSlug(entry.id, entry.title, "appel-offres"),
    organization: entry.companyName || "Organisation",
    organizationLetter: (entry.companyName || "O").slice(0, 1).toUpperCase(),
    organizationColor: "#27624f",
    profilePhoto: entry.companyLogo || "",
    location: entry.location || "Madagascar",
    title: entry.title,
    description: entry.content || entry.description,
    budget: entry.budget || "",
    currency: entry.currency || "MGA",
    deadline: entry.deadline || "",
    detailsPdfUrl: entry.detailsPdfUrl || "",
    detailsPdfName: entry.detailsPdfName || "",
    category: entry.category || "Autres",
    type: entry.type || "Projet",
    contact: entry.contactPhone || "",
    email: entry.contactEmail || "",
    ownerWpUserId: entry.ownerWpUserId || 0,
    ownerRatingAverage: Number(entry.ownerRatingAverage || 0),
    ownerRatingCount: Number(entry.ownerRatingCount || 0),
  });

  const bottomSimilarItems = relatedTenders.slice(0, 6).map(toSimilarTenderItem);

  return (
    <PublicListingDetailPage
      backHref="/appels-offres"
      backLabel="Retour aux appels d'offres"
      mode="tender"
      item={item}
      bottomSimilarItems={bottomSimilarItems}
      isOwner={isOwner}
      ownerEditHref="/profil/appels-offres"
      sellerListingsHref={
        item.ownerWpUserId
          ? `/appels-offres?ownerWpUserId=${encodeURIComponent(String(item.ownerWpUserId))}`
          : `/appels-offres?company=${encodeURIComponent(item.organization)}`
      }
    />
  );
}
