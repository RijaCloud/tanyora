import { permanentRedirect } from "next/navigation";

export default async function LegacyNewsArchivePage({ params }: { params: { year: string; month: string } }) {
  permanentRedirect(`/${params.year}/${params.month}`);
}
