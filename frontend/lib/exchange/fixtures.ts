export type ExchangeFixture = {
  id: string;
  title: string;
  family: "Pierres précieuses" | "Pierres fines" | "Collection";
  market: "local" | "international";
  specimen: string;
  quantity: string;
  offer: string;
  seller: string;
  description: string;
  imagePosition: string;
};

// Presentation-only data. No fixture ID belongs to WordPress or a real seller.
export const EXCHANGE_FIXTURES: readonly ExchangeFixture[] = [
  {
    id: "demo-saphir",
    title: "Saphir brut bleu",
    family: "Pierres précieuses",
    market: "local",
    specimen: "Lot témoin · cristaux bruts",
    quantity: "420 g (exemple)",
    offer: "Prix sur cotation",
    seller: "Organisation fictive 01",
    description: "Exemple de fiche avec photos, poids déclaré et documents à examiner avant toute mise en relation.",
    imagePosition: "0% 0%",
  },
  {
    id: "demo-tourmaline",
    title: "Tourmaline verte",
    family: "Pierres fines",
    market: "international",
    specimen: "Cristaux en matrice",
    quantity: "860 g (exemple)",
    offer: "Prix sur cotation",
    seller: "Organisation fictive 02",
    description: "Aperçu du parcours export : la destination et les habilitations devraient être contrôlées avant une demande.",
    imagePosition: "50% 0%",
  },
  {
    id: "demo-quartz-rose",
    title: "Quartz rose brut",
    family: "Collection",
    market: "local",
    specimen: "Bloc de collection",
    quantity: "1,4 kg (exemple)",
    offer: "Prix fixe fictif · 85 000 Ar",
    seller: "Organisation fictive 03",
    description: "Exemple de prix fixe affiché pour illustrer une commande future, sans vente ni paiement actif.",
    imagePosition: "100% 0%",
  },
  {
    id: "demo-quartz-fume",
    title: "Quartz fumé",
    family: "Collection",
    market: "local",
    specimen: "Pointes naturelles",
    quantity: "540 g (exemple)",
    offer: "Prix sur cotation",
    seller: "Organisation fictive 01",
    description: "Présentation de spécimen avec un descriptif technique et une quantité purement illustrative.",
    imagePosition: "0% 100%",
  },
  {
    id: "demo-grenat",
    title: "Grenat en matrice",
    family: "Pierres fines",
    market: "international",
    specimen: "Cristaux sur roche",
    quantity: "730 g (exemple)",
    offer: "Prix sur cotation",
    seller: "Organisation fictive 02",
    description: "L'exportation de ce lot fictif resterait soumise aux droits du vendeur et aux contrôles de destination.",
    imagePosition: "50% 100%",
  },
  {
    id: "demo-pyrite",
    title: "Pyrite cubique",
    family: "Collection",
    market: "local",
    specimen: "Agrégat cristallisé",
    quantity: "1,1 kg (exemple)",
    offer: "Prix fixe fictif · 120 000 Ar",
    seller: "Organisation fictive 03",
    description: "Une fiche de collection simulée pour visualiser le catalogue. La pyrite n'est pas de l'or.",
    imagePosition: "100% 100%",
  },
];

export function filterExchangeFixtures(query: string, family: string, market: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("fr");
  return EXCHANGE_FIXTURES.filter((item) =>
    (!normalizedQuery || `${item.title} ${item.family} ${item.specimen}`.toLocaleLowerCase("fr").includes(normalizedQuery)) &&
    (family === "all" || item.family === family) &&
    (market === "all" || item.market === market)
  );
}
