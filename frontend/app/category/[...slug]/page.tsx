import { buildMetadata } from "@/app/metadata";
import { NewsCollectionClientPage } from "@/features/news/components/NewsCollectionClientPage";
import { CategoryVisitTracker } from "@/features/news/components/CategoryVisitTracker";
import { humanizeCategoryLabel } from "@/features/news/lib/category-label";
import { NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";
import { extractHierarchicalSlug, extractTerminalSlug } from "@/features/news/lib/editorial-permalinks";

export const revalidate = NEWS_REVALIDATE_SECONDS;

export function generateMetadata({ params }: { params: { slug: string[] } }) {
  const slug = extractTerminalSlug(params.slug);
  const label = humanizeCategoryLabel(slug);
  return buildMetadata(`${label} - Actualités`, `Retrouvez toute l'actualité ${label} sur Tanyora.`, {
    path: `/category/${params.slug.map(encodeURIComponent).join("/")}`,
  });
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export default async function NewsCategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string[] };
  searchParams?: { page?: string };
}) {
  const slug = extractTerminalSlug(params.slug);
  const categoryPath = extractHierarchicalSlug(params.slug);
  const label = humanizeCategoryLabel(slug);

  return (
    <div className="space-y-4">
      <CategoryVisitTracker slug={slug} label={label} eventKey={`category-page:${slug}`} />
      <NewsCollectionClientPage
        title={`Categorie : ${label}`}
        eyebrow="Categorie"
        description="Retrouvez les articles classes dans cette rubrique sans attendre le chargement complet du flux editorial."
        endpoint={`/api/news/category/${categoryPath.split("/").map(encodeURIComponent).join("/")}`}
        emptyMessage="Aucun article disponible dans cette categorie pour le moment."
        currentPage={parsePage(searchParams?.page)}
        mode="category"
        selectedCategorySlug={slug}
        categoryPath={categoryPath}
      />
    </div>
  );
}
