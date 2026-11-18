import { buildMetadata, humanizeSlug } from "@/app/metadata";
import { NewsList } from "@/features/news/components/NewsList";
import { listByAuthor, NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";
import { PublicUnavailableState } from "@/components/errors/PublicUnavailableState";
import { loadPublicData } from "@/lib/public-data/safe-server-data";

export const revalidate = NEWS_REVALIDATE_SECONDS;

export function generateMetadata({ params }: { params: { slug: string } }) {
  return buildMetadata(`Auteur ${humanizeSlug(params.slug)}`, "Consultez les articles publics de cet auteur.");
}

export default async function NewsAuthorPage({ params }: { params: { slug: string } }) {
  const result = await loadPublicData(() => listByAuthor(params.slug), []);
  const articles = result.data;
  const authorLabel = articles[0]?.authorName || humanizeSlug(params.slug);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Auteur : {authorLabel}</h1>
      {result.available ? <NewsList articles={articles} /> : <PublicUnavailableState compact title="Les articles de cet auteur sont temporairement indisponibles" />}
    </div>
  );
}
