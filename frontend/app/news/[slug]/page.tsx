import { buildMetadata, toPlainText } from "@/app/metadata";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleView } from "@/features/news/components/ArticleView";
import { getNewsArticleBySlug, listRelatedArticles, NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";
import { ArticleStructuredData } from "@/components/seo/ArticleStructuredData";

export const revalidate = NEWS_REVALIDATE_SECONDS;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await getNewsArticleBySlug(params.slug);

  if (!article) {
    return buildMetadata("Info introuvable", "Cette information n'est plus disponible.", {
      path: `/news/${encodeURIComponent(params.slug)}`,
      noIndex: true,
    });
  }

  return buildMetadata(article.title, toPlainText(article.excerpt || article.content), {
    path: `/news/${encodeURIComponent(article.slug)}`,
    image: article.imageUrl,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.modifiedAt,
  });
}

export default async function Page({ params }: { params: { slug: string } }) {
  const article = await getNewsArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  if (article.flashSourcePostId && !article.flashSourceSlug) {
    notFound();
  }

  if (article.flashSourceSlug) {
    permanentRedirect(getEditorialArticlePath(article));
  }

  const relatedArticles = await listRelatedArticles(article, 4);
  return (
    <>
      <ArticleStructuredData
        title={article.title}
        description={article.excerpt || article.content}
        path={getEditorialArticlePath(article)}
        image={article.imageUrl}
        publishedAt={article.publishedAt}
        modifiedAt={article.modifiedAt}
        authorName={article.authorName}
        category={article.categoryLabel}
      />
      <ArticleView article={article} related={relatedArticles} />
    </>
  );
}
