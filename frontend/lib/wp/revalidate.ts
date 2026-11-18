import type { SubscriptionPlanId } from "@/types/subscriptions";
import type { PublicListingKind } from "@/lib/api/wordpress-internal";

export type NextRevalidatePayload = {
  event?: "post.created" | "post.updated" | "post.deleted" | "listing.boosted";
  postId?: number;
  postType?: string;
  slug?: string;
  status?: string;
  dateGmt?: string;
  modifiedGmt?: string;
  categories?: string[];
  taxonomies?: Record<string, string[]>;
  plan?: SubscriptionPlanId;
  invalidateScopes?: PublicListingKind[];
};

/** A boost changes the sponsored listing selection without saving the post. */
export function isListingBoostEvent(payload: NextRevalidatePayload): boolean {
  return payload.event === "listing.boosted";
}

const POST_TYPE_TO_MODULE: Record<string, string> = {
  post: "news",
  actualites: "news",
  news: "news",
  petites_annonces: "classifieds",
  classifieds: "classifieds",
  classified_ad: "classifieds",
  offres_emploi: "jobs",
  jobs: "jobs",
  job_offer: "jobs",
  appels_offres: "tenders",
  tenders: "tenders",
  tender_notice: "tenders",
  annuaire: "directory",
  directory: "directory",
  radio: "radio",
  web_radio: "radio",
};

export function resolveModuleTag(postType?: string): string | null {
  if (!postType) return null;
  return POST_TYPE_TO_MODULE[postType] ?? null;
}

export function buildRevalidateTags(payload: NextRevalidatePayload): string[] {
  const tags = new Set<string>(["wp", "wp:global"]);
  const moduleTag = resolveModuleTag(payload.postType);

  if (moduleTag) {
    tags.add(moduleTag);
    tags.add(`wp:${moduleTag}`);
  }

  if (payload.slug && moduleTag) {
    tags.add(`${moduleTag}:slug:${payload.slug}`);
  }

  for (const category of payload.categories ?? []) {
    if (moduleTag) {
      tags.add(`${moduleTag}:category:${category}`);
    }
  }

  return Array.from(tags);
}

export function buildRevalidatePaths(payload: NextRevalidatePayload): string[] {
  const paths = new Set<string>(["/"]);
  const moduleTag = resolveModuleTag(payload.postType);
  const archiveDateSource = payload.modifiedGmt || payload.dateGmt;
  const archiveDate = archiveDateSource ? new Date(archiveDateSource) : null;
  const archiveYear = archiveDate && Number.isFinite(archiveDate.getTime()) ? String(archiveDate.getUTCFullYear()) : null;
  const archiveMonth = archiveDate && Number.isFinite(archiveDate.getTime())
    ? String(archiveDate.getUTCMonth() + 1).padStart(2, "0")
    : null;

  if (moduleTag === "news") {
    paths.add("/actualites");
    if (payload.postType === "news") {
      paths.add("/news");
      if (payload.slug) paths.add(`/news/${payload.slug}`);
    } else if (payload.slug) {
      paths.add(`/${payload.slug}`);
      // Keep the legacy permalink cache coherent until its redirect is removed.
      paths.add(`/actualites/${payload.slug}`);
    }
    for (const category of payload.categories ?? []) {
      paths.add(`/actualites/categorie/${category}`);
      paths.add(`/category/${category}`);
    }
    if (archiveYear && archiveMonth) {
      paths.add(`/actualites/archives/${archiveYear}/${archiveMonth}`);
      paths.add(`/${archiveYear}/${archiveMonth}`);
    }
  }

  if (moduleTag === "classifieds") paths.add("/petites-annonces");
  if (moduleTag === "jobs") paths.add("/offres-emploi");
  if (moduleTag === "tenders") paths.add("/appels-offres");
  if (moduleTag === "directory") paths.add("/annuaire");
  if (moduleTag === "radio") paths.add("/radio");

  for (const scope of payload.invalidateScopes ?? []) {
    if (scope === "classified") paths.add("/petites-annonces");
    if (scope === "job") paths.add("/offres-emploi");
    if (scope === "tender") paths.add("/appels-offres");
  }

  paths.add("/tarifs");

  return Array.from(paths);
}

export function resolvePublicCacheKinds(payload: NextRevalidatePayload): PublicListingKind[] {
  const kinds = new Set<PublicListingKind>(payload.invalidateScopes ?? []);

  if (payload.postType === "petites_annonces" || payload.postType === "classifieds" || payload.postType === "classified_ad") {
    kinds.add("classified");
  }

  if (payload.postType === "offres_emploi" || payload.postType === "jobs" || payload.postType === "job_offer") {
    kinds.add("job");
  }

  if (payload.postType === "appels_offres" || payload.postType === "tenders" || payload.postType === "tender_notice") {
    kinds.add("tender");
  }

  if (payload.postType === "annuaire" || payload.postType === "directory") {
    kinds.add("directory");
  }

  return Array.from(kinds);
}
