import { buildMetadata, humanizeSlug } from "@/app/metadata";
import { NewsCollectionClientPage } from "@/features/news/components/NewsCollectionClientPage";
import { NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";
import { extractTerminalSlug } from "@/features/news/lib/editorial-permalinks";

export const revalidate = NEWS_REVALIDATE_SECONDS;

export function generateMetadata({ params }: { params: { slug: string[] } }) {
  const slug = extractTerminalSlug(params.slug);
  const label = humanizeSlug(slug);
  return buildMetadata(`${label} - Actualités`, `Retrouvez les articles et reportages liés à ${label} sur Tanyora.`, {
    path: `/tag/${params.slug.map(encodeURIComponent).join("/")}`,
  });
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export default async function NewsTagPage({
  params,
  searchParams,
}: {
  params: { slug: string[] };
  searchParams?: { page?: string };
}) {
  const slug = extractTerminalSlug(params.slug);
  const label = humanizeSlug(slug);

  return (
    <NewsCollectionClientPage
      title={`Tag : ${label}`}
      eyebrow="Tag"
      description={`Retrouvez les articles relies au tag ${label} dans le meme format editorial que les archives.`}
      endpoint={`/api/news/tag/${encodeURIComponent(slug)}`}
      emptyMessage="Aucun article disponible pour ce tag pour le moment."
      currentPage={parsePage(searchParams?.page)}
      mode="tag"
      selectedCategorySlug={null}
    />
  );
}
