import { buildMetadata, humanizeSlug } from "@/app/metadata";
import ProgramPage from "@/features/prototype/pages/ProgramPage";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export function generateMetadata({ params }: { params: { slug: string } }) {
  return buildMetadata(`Programme ${humanizeSlug(params.slug)}`, "Consultez les details du programme.");
}

export default function Page() {
  return <ProgramPage />;
}
