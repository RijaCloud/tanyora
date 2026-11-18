import type { NewsArticle } from "@/features/news/types";

export function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <article className="ui-card-flat h-full rounded-lg p-4 hover:border-brand-600">
      <div className="ui-text-soft mb-2 flex items-center justify-between gap-2 text-xs uppercase tracking-wide">
        <span>{article.categoryLabel ?? article.category}</span>
        {article.isPremium ? <span className="font-semibold text-amber-700">Premium</span> : null}
      </div>
      <h3 className="ui-text-main mb-2 text-lg font-semibold">{article.title}</h3>
      <p className="ui-text-muted text-sm">{article.excerpt}</p>
    </article>
  );
}
