import "server-only";
import { revalidatePath } from "next/cache";
import type { PublicListingKind } from "@/lib/api/wordpress-internal";

const LISTING_PATHS: Record<Exclude<PublicListingKind, "directory">, string> = {
  classified: "/petites-annonces",
  job: "/offres-emploi",
  tender: "/appels-offres",
};

export function revalidatePublicListingPaths(kind: Exclude<PublicListingKind, "directory">) {
  revalidatePath("/");
  revalidatePath(LISTING_PATHS[kind]);
}
