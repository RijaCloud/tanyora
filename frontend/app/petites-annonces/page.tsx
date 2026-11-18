import { getPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import PetitesAnnoncesPage from "@/features/prototype/pages/PetitesAnnoncesPage";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
export async function generateMetadata() {
  return getPublicPageMetadata("classifieds", "/petites-annonces", "Petites annonces", "Parcourez les petites annonces publiees sur la plateforme.");
}

export default function Page() {
  return <PetitesAnnoncesPage />;
}
