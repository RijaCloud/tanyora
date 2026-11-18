import { buildMetadata, toPlainText } from "@/app/metadata";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";
import PublicListingDetailPage from "@/features/prototype/components/PublicListingDetailPage";
import { getWordPressPublicListings } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { looksLikeListingHtml } from "@/lib/content/listing-html";
import { buildListingSlug, extractListingIdFromSlug } from "@/lib/listings/slug";
import { notFound, permanentRedirect } from "next/navigation";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

type ParamsShape = { id: string };

type ClassifiedPublisherSource = {
  publisherName?: string;
  companyName?: string;
};

function resolvePublisherName(source: ClassifiedPublisherSource): string {
  return String(source.publisherName || source.companyName || "Publié sur Tanyora").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripTrailingPriceFromDescription(description: string, price: string): string {
  const cleanDescription = String(description || "").trim();
  const cleanPrice = String(price || "").trim();
  if (!cleanDescription || !cleanPrice || looksLikeListingHtml(cleanDescription)) {
    return cleanDescription;
  }

  const trailingPriceRegex = new RegExp(`(?:\\s|\\n|\\r)+${escapeRegExp(cleanPrice)}\\s*$`);
  return cleanDescription.replace(trailingPriceRegex, "").trim();
}

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
    return buildMetadata("Annonce introuvable", "Cette annonce n'est plus disponible.", { path: `/petites-annonces/${encodeURIComponent(rawParam)}`, noIndex: true });
  }

  return buildMetadata(
    resolved.source.title,
    toPlainText(resolved.source.description || resolved.source.content || `Consultez l'annonce ${resolved.source.title} publiee sur Tanyora.`),
    {
      path: `/petites-annonces/${resolved.slug}`,
      image: resolved.source.image || resolved.source.images?.[0],
      type: "article",
      publishedTime: resolved.source.date,
      modifiedTime: resolved.source.lastModified,
    },
  );
}

export default async function PetiteAnnonceDetailPage({ params }: { params: Promise<ParamsShape> }) {
  const { id: rawParam } = await params;
  const resolved = await resolveClassifiedByParam(rawParam);
  if (!resolved) {
    notFound();
  }

  if (rawParam !== resolved.slug) {
    permanentRedirect(`/petites-annonces/${resolved.slug}`);
  }

  const source = resolved.source;
  const session = getServerSession();
  const ownerEmail = String(source.contactEmail || "").trim().toLowerCase();
  const viewerEmail = String(session?.email || "").trim().toLowerCase();
  const isOwner = Boolean(ownerEmail && viewerEmail && ownerEmail === viewerEmail);
  const publisherName = resolvePublisherName(source);

  const item = {
    id: source.id,
    slug: resolved.slug,
    seller: publisherName,
    sellerLetter: publisherName.slice(0, 1).toUpperCase() || "P",
    sellerColor: "#27624f",
    profilePhoto: source.profilePhoto || "",
    location: source.location || "Madagascar",
    title: source.title,
    description: stripTrailingPriceFromDescription(source.content || source.description, source.price || ""),
    price: source.price || "",
    condition: source.condition || "",
    date: source.date || "",
    category: source.category || "Divers",
    type: source.type || "",
    city: source.city || source.regions?.[0] || "",
    area: source.area || source.cities?.[0] || "",
    ownerWpUserId: source.ownerWpUserId || 0,
    ownerRatingAverage: source.ownerRatingAverage || 0,
    ownerRatingCount: source.ownerRatingCount || 0,
    image: source.image || source.images?.[0] || "/image-placeholder.png",
    images: Array.isArray(source.images) ? source.images : [],
    contact: source.contactPhone || "",
    email: source.contactEmail || "",
  };

  const relatedResult = item.category
    ? await getWordPressPublicListings("classified", {
        page: 1,
        perPage: 7,
        category: item.category,
      }).catch(() => null)
    : null;
  const relatedAds = (relatedResult?.items || []).filter((entry) => entry.id !== item.id);

  const toSimilarAdItem = (entry: (typeof relatedAds)[number]) => {
    const similarPublisherName = resolvePublisherName(entry);
    return {
      id: entry.id,
      slug: buildListingSlug(entry.id, entry.title, "annonce"),
      seller: similarPublisherName,
      sellerLetter: similarPublisherName.slice(0, 1).toUpperCase() || "P",
      sellerColor: "#27624f",
      profilePhoto: entry.profilePhoto || "",
      location: entry.location || "Madagascar",
      title: entry.title,
      description: stripTrailingPriceFromDescription(entry.content || entry.description, entry.price || ""),
      price: entry.price || "",
      condition: entry.condition || "",
      date: entry.date || "",
      category: entry.category || "Divers",
      type: entry.type || "",
      city: entry.city || entry.regions?.[0] || "",
      area: entry.area || entry.cities?.[0] || "",
      ownerWpUserId: entry.ownerWpUserId || 0,
      ownerRatingAverage: entry.ownerRatingAverage || 0,
      ownerRatingCount: entry.ownerRatingCount || 0,
      image: entry.image || entry.images?.[0] || "/image-placeholder.png",
      images: Array.isArray(entry.images) ? entry.images : [],
      contact: entry.contactPhone || "",
      email: entry.contactEmail || "",
    };
  };

  const bottomSimilarItems = relatedAds.slice(0, 6).map(toSimilarAdItem);

  return (
    <PublicListingDetailPage
      backHref="/petites-annonces"
      backLabel="Retour aux petites annonces"
      mode="ad"
      item={item}
      bottomSimilarItems={bottomSimilarItems}
      isOwner={isOwner}
      ownerEditHref="/profil/petites-annonces"
      sellerListingsHref={item.ownerWpUserId ? `/petites-annonces?ownerWpUserId=${encodeURIComponent(String(item.ownerWpUserId))}` : "/petites-annonces"}
    />
  );
}
