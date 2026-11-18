import { getPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { NewsLandingPage } from "@/features/news/components/NewsLandingPage";
import {
  getEditorialLandingData,
  NEWS_REVALIDATE_SECONDS,
} from "@/features/news/data/news.repository";
import { loadPublicData } from "@/lib/public-data/safe-server-data";

export const dynamic = "force-dynamic";
export const revalidate = NEWS_REVALIDATE_SECONDS;
export async function generateMetadata() {
  return getPublicPageMetadata("news", "/actualites", "Actualités", "Retrouvez les dernières actualités, le fil info en direct et les reportages de Tanyora.");
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const selectedCategory = typeof searchParams?.category === "string" ? searchParams.category : null;
  const landingResult = await loadPublicData(
    () => getEditorialLandingData(!selectedCategory),
    {
      articles: [],
      taxonomy: { categories: [], tags: [] },
      newsFeed: { articles: [], pagination: { page: 1, perPage: 10, hasNextPage: false } },
      featured: { articles: [], pagination: { page: 1, perPage: 6, hasNextPage: false } },
      editorialSections: [],
    },
  );
  const fallbackArticles = Array.from(
    new Map([...landingResult.data.featured.articles, ...landingResult.data.newsFeed.articles].map((article) => [article.id, article])).values(),
  );
  const articles = landingResult.data.articles.length > 0 ? landingResult.data.articles : fallbackArticles;

  return (
    <NewsLandingPage
      articles={articles}
      taxonomyCategories={landingResult.data.taxonomy.categories}
      selectedCategory={selectedCategory}
      editorialSections={landingResult.data.editorialSections}
      newsFeed={landingResult.data.newsFeed.articles}
      featuredArticles={landingResult.data.featured.articles}
      dataUnavailable={!landingResult.available}
    />
  );
}
