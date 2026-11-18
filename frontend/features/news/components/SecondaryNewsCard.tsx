import Link from "next/link";
import type { NewsArticle } from "@/features/news/types";
import { NEWS_IMAGE_PLACEHOLDER } from "@/features/news/lib/image-placeholder";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";
import { AppImage } from "@/components/ui/AppImage";

const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
  "&rsquo;": "'",
  "&lsquo;": "'",
  "&rdquo;": '"',
  "&ldquo;": '"',
  "&hellip;": "...",
  "&ndash;": "-",
  "&mdash;": "-",
};

function formatDate(input: string): string {
  const date = new Date(input);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toPlainText(value: string, maxLength = 120) {
  let output = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  for (const [entity, decoded] of Object.entries(HTML_ENTITY_MAP)) {
    output = output.split(entity).join(decoded);
  }

  output = output
    .replace(/&#(\d+);/g, (_, codePoint) => {
      const parsed = Number.parseInt(codePoint, 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => {
      const parsed = Number.parseInt(codePoint, 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    });

  if (output.length <= maxLength) {
    return output;
  }

  return `${output.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

export function SecondaryNewsCard({ article }: { article: NewsArticle }) {
  const image = article.imageUrl || NEWS_IMAGE_PLACEHOLDER;

  return (
    <Link
      href={getEditorialArticlePath(article)}
      className="group relative block h-[182px] overflow-hidden rounded-[20px] border border-[var(--border-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]"
    >
      <AppImage
        alt=""
        src={image}
        responsiveSources={article.imageSources}
        sizes="(min-width: 1280px) 329px, (min-width: 768px) 33vw, 100vw"
        withLoader
        wrapperClassName="absolute inset-0"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[var(--motion-ease-standard)] group-hover:scale-[1.025]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
      <div className="absolute inset-x-3 bottom-3 rounded-[18px] bg-white/95 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur-md">
        <p className="mb-2 text-[11px] text-slate-500">{formatDate(article.publishedAt)}</p>
        <p className="line-clamp-3 text-sm leading-6 text-slate-900">{toPlainText(article.excerpt || article.content, 112)}</p>
        <span className="mt-3 inline-flex text-xs font-semibold text-[#27624f]">Lire plus</span>
      </div>
    </Link>
  );
}
