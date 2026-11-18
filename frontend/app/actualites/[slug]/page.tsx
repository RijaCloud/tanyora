import { getNewsArticleBySlug, getPostArticleBySlug } from "@/features/news/data/news.repository";
import { notFound, permanentRedirect } from "next/navigation";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";

export default async function Page({ params }: { params: { slug: string } }) {
  const article = await getPostArticleBySlug(params.slug);

  if (article) {
    permanentRedirect(`/${encodeURIComponent(article.slug)}`);
  }

  const newsItem = await getNewsArticleBySlug(params.slug);
  if (newsItem) {
    permanentRedirect(getEditorialArticlePath(newsItem));
  }

  notFound();
}
