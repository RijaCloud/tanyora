import { buildMetadata, toPlainText } from "@/app/metadata";
import { notFound } from "next/navigation";
import { ArticleView } from "@/features/news/components/ArticleView";
import { CategoryVisitTracker } from "@/features/news/components/CategoryVisitTracker";
import { getPostArticleBySlug, listRelatedArticles, NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";
import { ArticleStructuredData } from "@/components/seo/ArticleStructuredData";

export const revalidate = NEWS_REVALIDATE_SECONDS;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await getPostArticleBySlug(params.slug);

  if (!article) {
    return buildMetadata("Article introuvable", "Cet article n'est plus disponible.", {
      path: `/${encodeURIComponent(params.slug)}`,
      noIndex: true,
    });
  }

  return buildMetadata(article.title, toPlainText(article.excerpt || article.content), {
    path: `/${encodeURIComponent(article.slug)}`,
    image: article.imageUrl,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.modifiedAt,
  });
}

export default async function Page({ params }: { params: { slug: string } }) {
  const article = await getPostArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await listRelatedArticles(article, 4);

  return (
    <>
      <ArticleStructuredData
        title={article.title}
        description={article.excerpt || article.content}
        path={`/${encodeURIComponent(article.slug)}`}
        image={article.imageUrl}
        publishedAt={article.publishedAt}
        modifiedAt={article.modifiedAt}
        authorName={article.authorName}
        category={article.categoryLabel}
      />
      <CategoryVisitTracker slug={article.category} label={article.categoryLabel} eventKey={`article:${article.slug}`} />
      <ArticleView article={article} related={relatedArticles} />
    </>
  );
}
