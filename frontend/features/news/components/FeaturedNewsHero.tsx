import Link from "next/link";
import type { NewsArticle } from "@/features/news/types";
import { NEWS_IMAGE_PLACEHOLDER } from "@/features/news/lib/image-placeholder";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";
import { AppImage } from "@/components/ui/AppImage";

function formatDate(input: string): string {
  const date = new Date(input);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function FeaturedNewsHero({ article }: { article: NewsArticle }) {
  const image = article.imageUrl || NEWS_IMAGE_PLACEHOLDER;

  return (
    <Link
      href={getEditorialArticlePath(article)}
      className="group relative block h-[380px] overflow-hidden rounded-[20px] bg-slate-800 transition hover:shadow-xl"
    >
      <AppImage
        alt=""
        src={image}
        responsiveSources={article.imageSources}
        sizes="(min-width: 1280px) 793px, 100vw"
        eager
        withLoader
        wrapperClassName="absolute inset-0"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[var(--motion-ease-standard)] group-hover:scale-[1.025]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 text-white">
        <div className="mb-3 flex flex-wrap gap-2">
          {(article.tags || [article.category]).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              {tag}
            </span>
          ))}
          {article.isPremium ? <span className="rounded-full bg-[#27624f] px-3 py-1 text-xs font-semibold">Premium</span> : null}
        </div>
        <p className="mb-2 text-sm opacity-90">{formatDate(article.publishedAt)}</p>
        <h2 className="text-2xl font-bold leading-tight">{article.title}</h2>
      </div>
    </Link>
  );
}
