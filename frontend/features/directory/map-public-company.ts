import type { PublicListingItem } from "@/lib/api/wordpress-internal";
import type { DirectoryCompany } from "@/features/directory/types";

export function mapPublicDirectoryCompany(item: PublicListingItem, index = 0): DirectoryCompany {
  const name = (item.companyName || item.title || "").trim();
  const ownerWpUserId = Number(item.ownerWpUserId || 0);
  const hasProfilePhoto = (item as PublicListingItem & { hasProfilePhoto?: boolean }).hasProfilePhoto === true;
  const featuredImage = typeof item.image === "string" && item.image.trim() ? item.image : null;
  const palette = ["#27624f", "#111111", "#2563EB", "#14B8A6", "#F59E0B", "#8B5CF6", "#16A34A", "#EA580C"];

  return {
    id: String(item.id),
    name,
    initial: name.charAt(0).toUpperCase() || "A",
    color: palette[index % palette.length],
    location: item.location || "Madagascar",
    regions: Array.isArray(item.regions) ? item.regions.filter(Boolean) : [],
    cities: Array.isArray(item.cities) ? item.cities.filter(Boolean) : [],
    industry: item.category || "Services",
    description: (item.description || item.content || "").trim(),
    phone: item.contactPhone || "Non communique",
    email: item.contactEmail || "Non communique",
    website: item.website || undefined,
    featured: Boolean(item.featured),
    imageUrl: featuredImage || item.companyLogo || (hasProfilePhoto ? item.profilePhoto || null : null),
    ownerWpUserId: ownerWpUserId > 0 ? ownerWpUserId : undefined,
  };
}
