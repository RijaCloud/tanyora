import { getPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import JobsPage from "@/features/prototype/pages/JobsPage";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
export async function generateMetadata() {
  return getPublicPageMetadata("jobs", "/offres-emploi", "Offres d'emploi", "Consultez les offres d'emploi disponibles sur Tanyora.");
}

export default function Page() {
  return <JobsPage />;
}
