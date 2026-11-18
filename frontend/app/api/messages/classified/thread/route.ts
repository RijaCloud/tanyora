import { createListingThreadHandlers } from "@/lib/messages/listing-thread-helpers";

export const { GET, POST } = createListingThreadHandlers({
  kind: "classified",
  basePath: "/petites-annonces",
  fallbackPrefix: "annonce",
  ownerLabel: `l'annonce`,
});
