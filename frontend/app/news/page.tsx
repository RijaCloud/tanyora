import { buildMetadata } from "@/app/metadata";
import { NewsFeedPage } from "@/features/news/components/NewsFeedPage";
import { listNewsFeedPage, NEWS_REVALIDATE_SECONDS } from "@/features/news/data/news.repository";
import { loadPublicData } from "@/lib/public-data/safe-server-data";

export const revalidate = NEWS_REVALIDATE_SECONDS;

export function generateMetadata() {
  return buildMetadata("Fil d'info", "Retrouvez les dernieres informations de Tanyora.", {
    path: "/news",
  });
}

export default async function NewsPage() {
  const feed = await loadPublicData(() => listNewsFeedPage(1, 24), { articles: [], pagination: { page: 1, perPage: 24, hasNextPage: false } });
  return <NewsFeedPage articles={feed.data.articles} isUnavailable={!feed.available} />;
}
