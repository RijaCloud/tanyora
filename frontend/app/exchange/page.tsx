import type { Metadata } from "next";
import { ExchangeCatalog } from "@/features/exchange/ExchangeCatalog";

export const metadata: Metadata = {
  title: "Exchange | Aperçu Tanyora",
  description: "Aperçu fictif de la future place de marché de minéraux Tanyora. Aucune offre ou transaction réelle.",
  robots: { index: false, follow: false },
};

export default function ExchangePage() {
  return <ExchangeCatalog />;
}
