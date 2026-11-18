"use client";

import Link from "next/link";
import { Fragment, type CSSProperties, useEffect, useState } from "react";

import type { NewsArticle } from "@/features/news/types";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";

const HEADLINE_COUNT = 10;
/** Vitesse de lecture lisible, plafonnée pour que le ruban ne paraisse jamais figé. */
const SECONDS_PER_HEADLINE = 12;

type FeedResponse = {
  articles?: NewsArticle[];
};

type FlashInfoBarProps = {
  /** Align the bar with the public header instead of the viewport. */
  contained?: boolean;
  /** Keep the scrolling viewport aligned with the home editorial content. */
  homeAligned?: boolean;
};

/**
 * Bandeau d'actualités défilant horizontalement.
 *
 * Alimenté par la même source que le fil d'actualité, pour que les deux disent
 * la même chose. La liste est rendue deux fois : l'animation translate le ruban
 * de la moitié de sa largeur, donc la boucle n'est sans raccord que si la
 * seconde copie prolonge exactement la première.
 */
export function FlashInfoBar({ contained = false, homeAligned = false }: FlashInfoBarProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isInteractionPaused, setIsInteractionPaused] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  useEffect(() => {
    const syncVisibility = () => setIsDocumentVisible(document.visibilityState === "visible");
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/news/feed?page=1&perPage=${HEADLINE_COUNT}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("flash-info-unavailable");
        }
        return (await response.json()) as FeedResponse;
      })
      .then((payload) => {
        if (isMounted) {
          setArticles(Array.isArray(payload.articles) ? payload.articles : []);
        }
      })
      .catch((error) => {
        console.error("[flash-info] chargement impossible", error);
        if (isMounted) {
          setArticles([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (articles.length === 0) {
    return null;
  }

  const scrollDuration = `${Math.min(Math.max(articles.length * SECONDS_PER_HEADLINE, 60), 120)}s`;
  const headlines = (
    <div className="flex shrink-0 items-center">
      {articles.map((article, index) => (
        <Fragment key={article.id}>
          <Link
            href={getEditorialArticlePath(article)}
            className="inline-block px-4 text-sm text-[#3a1717] transition-colors hover:text-[#190a0a]"
          >
            {index === 0 ? <><span className="font-semibold text-[var(--brand-red)]">FLASH INFO</span> : </> : null}
            {article.title}
          </Link>
          <span className="flash-info-separator" aria-hidden="true" />
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      className={`relative overflow-hidden bg-[var(--color-cream)] px-3 py-2 md:px-6 md:py-3${contained ? " flash-info-bar--contained" : ""}${homeAligned ? " flash-info-bar--home" : ""}`}
      onFocusCapture={() => setIsInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsInteractionPaused(false);
        }
      }}
    >
      <div className={homeAligned ? "flash-info-content" : contained ? "" : "prototype-nav mx-auto max-w-[1440px]"}>
        <div
          className="flash-info-scroll flex w-max animate-scroll whitespace-nowrap"
          style={{
            "--flash-info-duration": scrollDuration,
            animationDuration: scrollDuration,
            animationPlayState: !isDocumentVisible || isInteractionPaused ? "paused" : "running",
          } as CSSProperties & Record<"--flash-info-duration", string>}
        >
          {headlines}
          {/* Copie de boucle : masquée aux lecteurs d'écran pour ne pas répéter les titres. */}
          <div aria-hidden="true" className="flex shrink-0 items-center">
            {articles.map((article, index) => (
              <Fragment key={`loop-${article.id}`}>
                <span className="inline-block px-4 text-sm text-[#3a1717]">
                {index === 0 ? <><span className="font-semibold text-[var(--brand-red)]">FLASH INFO</span> : </> : null}
                {article.title}
                </span>
                <span className="flash-info-separator" />
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
