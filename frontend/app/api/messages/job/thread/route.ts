import { createListingThreadHandlers } from "@/lib/messages/listing-thread-helpers";

export const { GET, POST } = createListingThreadHandlers({
  kind: "job",
  basePath: "/offres-emploi",
  fallbackPrefix: "offre",
  ownerLabel: `l'offre d'emploi`,
});
