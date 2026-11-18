import { getPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import PricingPage from "@/features/prototype/pages/PricingPage";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
export async function generateMetadata() {
  return getPublicPageMetadata("pricing", "/tarifs", "Tarifs", "Découvrez les différentes formules et abonnements disponibles.");
}

export default function Page() {
  return <PricingPage />;
}
