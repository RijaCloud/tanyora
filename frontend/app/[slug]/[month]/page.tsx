import { buildMetadata } from "@/app/metadata";
import { notFound } from "next/navigation";
import { NewsCollectionClientPage } from "@/features/news/components/NewsCollectionClientPage";
import { NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";

export const revalidate = NEWS_REVALIDATE_SECONDS;

export function generateMetadata({ params }: { params: { slug: string; month: string } }) {
  return buildMetadata(`Archives ${params.month}/${params.slug}`, "Retrouvez les articles publies sur cette periode.");
}

function parseArchivePage(value?: string) {
  const page = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return page;
}

export default async function PublicNewsArchivePage({
  params,
  searchParams,
}: {
  params: { slug: string; month: string };
  searchParams?: { page?: string };
}) {
  if (!/^\d{4}$/.test(params.slug) || !/^(0[1-9]|1[0-2])$/.test(params.month)) {
    notFound();
  }

  const currentPage = parseArchivePage(searchParams?.page);

  return (
    <NewsCollectionClientPage
      title={`Archives ${params.month}/${params.slug}`}
      eyebrow="Archives"
      description="Consultez les articles publies sur cette periode dans une vue editoriale plus fluide."
      endpoint={`/api/news/archive/${params.slug}/${params.month}`}
      emptyMessage="Aucun article disponible pour cette periode."
      currentPage={currentPage}
      mode="archive"
      archiveYear={params.slug}
      archiveMonth={params.month}
    />
  );
}

