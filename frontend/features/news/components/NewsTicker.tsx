"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { NewsArticle } from "@/features/news/types";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";

const PER_PAGE = 10;
/** Vitesse de défilement, en pixels par seconde. */
const SCROLL_SPEED = 12;
/** On recharge dès qu'il reste moins que ça devant, pour que le fil ne se vide jamais. */
const PREFETCH_THRESHOLD = 4;
/**
 * Garde-fou mémoire. Le recyclage retire déjà chaque article sorti du cadre ;
 * ce plafond protège d'un défilement pathologique.
 */
const MAX_ARTICLES = 60;

function formatTickerDate(input: string) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

type FeedResponse = {
  articles?: NewsArticle[];
  pagination?: { hasNextPage?: boolean };
};

type NewsTickerProps = {
  title: string;
  articles: NewsArticle[];
  /** Défilement continu vers le haut, avec pagination en arrière-plan. */
  autoScroll?: boolean;
  /** Hauteur de la fenêtre de défilement, en pixels. */
  height?: number;
  className?: string;
};

/**
 * Fil d'actualité, partagé entre l'accueil et /actualites pour que les deux
 * surfaces ne divergent pas.
 *
 * Le défilement agit sur `scrollTop` du conteneur plutôt que sur une
 * transformation du ruban : la liste reste une liste réellement défilable, donc
 * utilisable au doigt comme à la molette, et lisible même si le script
 * s'interrompt.
 */
export function NewsTicker({
  title,
  articles: initialArticles,
  autoScroll = false,
  height = 240,
  className = "",
}: NewsTickerProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [isPaused, setIsPaused] = useState(false);

  const pageRef = useRef(1);
  const hasNextPageRef = useRef(true);
  const isLoadingRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  /**
   * Défilement accumulé en flottant. `scrollTop` arrondit dans certains
   * navigateurs : y ajouter un tiers de pixel par image perdrait le reste à
   * chaque fois, et le fil resterait immobile.
   */
  const offsetRef = useRef(0);
  /**
   * Hauteur de l'article retiré dont la compensation reste à appliquer. Elle
   * ne peut l'être qu'une fois le retrait effectif dans le DOM : compenser
   * pendant que l'article est encore là ferait remonter la liste d'un cran.
   */
  const pendingAdjustRef = useRef(0);

  useEffect(() => {
    setArticles(initialArticles);
    pageRef.current = 1;
    hasNextPageRef.current = true;
    offsetRef.current = 0;
    pendingAdjustRef.current = 0;
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
  }, [initialArticles]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    // Source épuisée : on repart de la première page plutôt que de laisser le
    // fil se vider, ce qui ramène au passage les articles publiés depuis.
    const nextPage = hasNextPageRef.current ? pageRef.current + 1 : 1;

    try {
      const response = await fetch(`/api/news/feed?page=${nextPage}&perPage=${PER_PAGE}`);
      if (!response.ok) {
        throw new Error("Unable to load the news feed.");
      }

      const payload = (await response.json()) as FeedResponse;
      const incoming = Array.isArray(payload.articles) ? payload.articles : [];

      if (incoming.length === 0) {
        hasNextPageRef.current = false;
        pageRef.current = 1;
        return;
      }

      setArticles((current) => {
        const seen = new Set(current.map((article) => article.id));
        const merged = [...current];
        for (const article of incoming) {
          if (!seen.has(article.id)) {
            seen.add(article.id);
            merged.push(article);
          }
        }
        return merged.slice(-MAX_ARTICLES);
      });

      pageRef.current = nextPage;
      hasNextPageRef.current = Boolean(payload.pagination?.hasNextPage);
    } catch (error) {
      console.error("[news] chargement du fil impossible", error);
      hasNextPageRef.current = false;
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!autoScroll) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    let frame = 0;
    let previousTime: number | null = null;

    const step = (time: number) => {
      frame = window.requestAnimationFrame(step);

      if (previousTime === null) {
        previousTime = time;
        return;
      }

      const elapsed = Math.min((time - previousTime) / 1000, 0.1);
      previousTime = time;

      if (isPaused || document.visibilityState !== "visible") {
        return;
      }

      // Rien à faire tant que le contenu tient dans le cadre.
      if (viewport.scrollHeight <= viewport.clientHeight) {
        return;
      }

      offsetRef.current += SCROLL_SPEED * elapsed;

      viewport.scrollTop = offsetRef.current;

      // Un article entièrement sorti du cadre est retiré de la liste. La
      // compensation est différée au rendu suivant, sinon la position
      // visible reculerait le temps que React retire l'élément.
      if (pendingAdjustRef.current > 0) {
        return;
      }

      const firstHeight = itemRefs.current[0]?.offsetHeight ?? 0;
      if (firstHeight > 0 && offsetRef.current >= firstHeight) {
        pendingAdjustRef.current = firstHeight;
        setArticles((current) => (current.length > 1 ? current.slice(1) : current));
      }
    };

    frame = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [autoScroll, isPaused]);

  useLayoutEffect(() => {
    if (pendingAdjustRef.current <= 0) {
      return;
    }

    offsetRef.current = Math.max(0, offsetRef.current - pendingAdjustRef.current);
    pendingAdjustRef.current = 0;

    if (viewportRef.current) {
      viewportRef.current.scrollTop = offsetRef.current;
    }
  }, [articles]);

  useEffect(() => {
    if (!autoScroll) {
      return;
    }

    if (articles.length <= PREFETCH_THRESHOLD) {
      void loadMore();
    }
  }, [articles.length, autoScroll, loadMore]);

  if (articles.length === 0) {
    return null;
  }

  return (
    <section
      className={`space-y-4 ${className}`.trim()}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <h3 className="text-[16px] font-bold uppercase tracking-[0.12em] text-[#27624f]">{title}</h3>

      <div ref={viewportRef} className="ui-scrollbar-hidden overflow-y-auto pr-4" style={{ maxHeight: height }}>
        <ul className="space-y-4 border-r border-[var(--border-strong)] pr-4">
          {articles.map((article, index) => (
            <li
              key={article.id}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
            >
              <Link href={getEditorialArticlePath(article)} className="block space-y-1 group">
                <p className="font-[Georgia] text-[13px] font-bold leading-[1.3] text-[var(--text-main)] transition-colors group-hover:text-[#27624f]">
                  {article.title}
                </p>
                <p className="text-[11px] leading-[1.45] text-[var(--text-soft)]">
                  {formatTickerDate(article.publishedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/actualites"
        className="inline-flex text-xs font-semibold text-[#27624f] transition-colors hover:text-[#a81720]"
      >
        Voir toutes les actualités
      </Link>
    </section>
  );
}
