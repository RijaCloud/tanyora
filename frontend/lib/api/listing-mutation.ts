import { revalidatePublicListingPaths } from "@/lib/api/revalidate-public-listings";
import { invalidatePublicWordPressCache, type PublicListingKind } from "@/lib/api/wordpress-internal";

/**
 * Cache refreshes must never turn a completed WordPress mutation into a client error.
 * The next read is still protected by the existing cache TTL if this best-effort work fails.
 */
export function refreshPublicListingData(kind: Exclude<PublicListingKind, "directory">) {
  void Promise.all([invalidatePublicWordPressCache(kind), revalidatePublicListingPaths(kind)]).catch((error) => {
    console.error("[listing-mutation] cache refresh failed", { kind, error });
  });
}

export function createListingRequestId() {
  return crypto.randomUUID();
}
