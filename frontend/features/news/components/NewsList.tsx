import Link from "next/link";
import type { NewsArticle } from "@/features/news/types";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";

export function NewsList({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) {
    return <p className="text-slate-500">Aucun article disponible.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {articles.map((article) => (
        <Link href={getEditorialArticlePath(article)} key={article.id}>
          <ArticleCard article={article} />
        </Link>
      ))}
    </div>
  );
}
