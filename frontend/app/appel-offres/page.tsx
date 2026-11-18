import { getPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import AppelOffresPage from "@/features/prototype/pages/AppelOffresPage";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
export async function generateMetadata() {
  return getPublicPageMetadata("tenders", "/appel-offres", "Appels d'offres", "Consultez les appels d'offres publies sur la plateforme.");
}

export default function Page() {
  return <AppelOffresPage />;
}
