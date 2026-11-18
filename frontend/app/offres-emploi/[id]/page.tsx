import { buildMetadata, toPlainText } from "@/app/metadata";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";
import PublicListingDetailPage from "@/features/prototype/components/PublicListingDetailPage";
import { getWordPressPublicListings } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { buildListingSlug, extractListingIdFromSlug } from "@/lib/listings/slug";
import { notFound, permanentRedirect } from "next/navigation";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

async function resolveJob(paramValue: string) {
  const listingId = extractListingIdFromSlug(paramValue);
  if (!listingId) {
    return null;
  }

  const result = await getWordPressPublicListings("job", { id: listingId, perPage: 1 });
  const source = result.items[0];
  if (!source) {
    return null;
  }

  const slug = buildListingSlug(source.id, source.title, "offre");
  return { source, slug };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resolved = await resolveJob(id);
  const source = resolved?.source;
  if (!source) {
    return buildMetadata("Offre introuvable", "Cette offre d'emploi n'est plus disponible.", { path: `/offres-emploi/${encodeURIComponent(id)}`, noIndex: true });
  }

  return buildMetadata(
    source.title,
    toPlainText(source.description || source.content || `Consultez l'offre ${source.title} publiee par ${source.companyName || "Entreprise"}.`),
    {
      path: `/offres-emploi/${resolved!.slug}`,
      image: source.companyLogo || source.image || source.images?.[0],
      type: "article",
      publishedTime: source.date,
      modifiedTime: source.lastModified,
    },
  );
}

export default async function OffreEmploiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resolved = await resolveJob(id);
  if (!resolved) {
    notFound();
  }

  if (id !== resolved.slug) {
    permanentRedirect(`/offres-emploi/${resolved.slug}`);
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
    company: source.companyName || "Entreprise",
    companyLetter: (source.companyName || "E").slice(0, 1).toUpperCase(),
    companyColor: "#27624f",
    profilePhoto: source.companyLogo || "",
    location: source.location || "Madagascar",
    title: source.title,
    description: source.content || source.description,
    date: source.date || "",
    category: source.category || "Autres",
    type: source.type || "",
    skills: Array.isArray(source.skills) ? source.skills : [],
    experienceYears: source.experienceYears || "",
    needBy: source.needBy || "",
    deadline: source.deadline || "",
    contact: source.contactPhone || "",
    email: source.contactEmail || "",
    ownerWpUserId: source.ownerWpUserId || 0,
    ownerRatingAverage: Number(source.ownerRatingAverage || 0),
    ownerRatingCount: Number(source.ownerRatingCount || 0),
  };

  const relatedResult = item.category
    ? await getWordPressPublicListings("job", {
        page: 1,
        perPage: 7,
        category: item.category,
      }).catch(() => null)
    : null;
  const relatedJobs = (relatedResult?.items || []).filter((entry) => entry.id !== item.id);

  const toSimilarJobItem = (entry: (typeof relatedJobs)[number]) => ({
    id: entry.id,
    slug: buildListingSlug(entry.id, entry.title, "offre"),
    company: entry.companyName || "Entreprise",
    companyLetter: (entry.companyName || "E").slice(0, 1).toUpperCase(),
    companyColor: "#27624f",
    profilePhoto: entry.companyLogo || "",
    location: entry.location || "Madagascar",
    title: entry.title,
    description: entry.content || entry.description,
    date: entry.date || "",
    category: entry.category || "Autres",
    type: entry.type || "",
    skills: Array.isArray(entry.skills) ? entry.skills : [],
    experienceYears: entry.experienceYears || "",
    needBy: entry.needBy || "",
    deadline: entry.deadline || "",
    contact: entry.contactPhone || "",
    email: entry.contactEmail || "",
    ownerWpUserId: entry.ownerWpUserId || 0,
    ownerRatingAverage: Number(entry.ownerRatingAverage || 0),
    ownerRatingCount: Number(entry.ownerRatingCount || 0),
  });

  const bottomSimilarItems = relatedJobs.slice(0, 6).map(toSimilarJobItem);

  return (
    <PublicListingDetailPage
      backHref="/offres-emploi"
      backLabel="Retour aux offres d'emploi"
      mode="job"
      item={item}
      bottomSimilarItems={bottomSimilarItems}
      isOwner={isOwner}
      ownerEditHref="/profil/offres-emploi"
      sellerListingsHref={
        item.ownerWpUserId
          ? `/offres-emploi?ownerWpUserId=${encodeURIComponent(String(item.ownerWpUserId))}`
          : `/offres-emploi?company=${encodeURIComponent(item.company)}`
      }
    />
  );
}
