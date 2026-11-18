import { createListingThreadHandlers } from "@/lib/messages/listing-thread-helpers";

export const { GET, POST } = createListingThreadHandlers({
  kind: "tender",
  basePath: "/appels-offres",
  fallbackPrefix: "appel-offres",
  ownerLabel: `l'appel d'offres`,
});
