"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { useAdsenseConfig } from "@/components/adsense/AdsenseConfigContext";
import { AppImage } from "@/components/ui/AppImage";
import { ArticleComments } from "@/features/news/components/ArticleComments";
import { ArticleSaveButton } from "@/features/news/components/ArticleCardActions";
import { FlashInfoBar } from "@/features/news/components/FlashInfoBar";
import { NEWS_IMAGE_PLACEHOLDER } from "@/features/news/lib/image-placeholder";
import { previewRestrictedArticleHtml } from "@/features/news/lib/article-preview";
import { getEditorialArticlePath, normalizeEditorialUriToPath } from "@/features/news/lib/editorial-permalinks";
import { canReadFullArticle } from "@/features/news/lib/read-access";
import type { NewsArticle } from "@/features/news/types";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { trackContentView } from "@/lib/analytics/ga4";

function formatDate(input: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(input));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function splitHtmlIntoBlocks(html: string): string[] {
  const normalized = (html || "").trim();
  if (!normalized) {
    return [];
  }

  const blocks = normalized
    .split(/(?=<(?:p|h2|h3|ul|ol|blockquote|figure|img)\b)/i)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.length > 0 ? blocks : [normalized];
}

function formatMetric(value: number | undefined, noun: string) {
  return `${value ?? 0} ${noun}`;
}

function ReadAccessGate({ minimumPlanRequired }: { minimumPlanRequired: NewsArticle["minimumPlanRequired"] }) {
  const { isLoggedIn, setShowLoginModal } = useAuth();
  const requiredPlan = minimumPlanRequired === "business" ? "Business" : "Essentiel ou Business";

  return (
    <div className="rounded-[20px] border border-[#F2C2C4] bg-[linear-gradient(180deg,#fff6f6,#ffffff)] p-6 shadow-[0_18px_50px_rgba(204,32,42,0.08)] dark:border-[#703337] dark:bg-[linear-gradient(180deg,#321f20,#1b1b1b)]">
      <p className="mb-3 inline-flex rounded-full bg-[#27624f]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#27624f]">
        Lecture limitée
      </p>
      <h3 className="text-[22px] font-semibold leading-tight text-[#111111] dark:text-white">
        Cet article est réservé aux abonnés {requiredPlan}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[#5f5f5f] dark:text-[#c8c8c8]">
        Vous consultez un aperçu. Pour lire cet article en entier, choisissez un abonnement {requiredPlan}.
        Les articles en accès libre restent disponibles sans abonnement.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/tarifs"
          className="rounded-2xl bg-[#c91f1f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#a71919]"
        >
          Voir les abonnements
        </Link>
        {!isLoggedIn ? (
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="rounded-2xl border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--hover-surface)]"
          >
            Déjà abonné ? Se connecter
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ArticleView({
  article,
  related,
}: {
  article: NewsArticle;
  related: NewsArticle[];
}) {
  const { isLoggedIn, userPlan } = useAuth();
  const { slots, canRenderSlot, articleInlineStartAfterBlocks, articleInlineRepeatEveryBlocks } = useAdsenseConfig();
  const hasFullAccess = canReadFullArticle(article.minimumPlanRequired, isLoggedIn, userPlan);
  const isNewsItem = article.source === "news";
  const articleBodyRef = useRef<HTMLElement | null>(null);
  const [commentCount, setCommentCount] = useState(article.commentCount ?? 0);
  const image = article.imageUrl || NEWS_IMAGE_PLACEHOLDER;
  const previewSpaces = Math.max(1, article.previewSpaces ?? 115);
  const contentHtml = hasFullAccess
    ? article.content
    : `<p>${previewRestrictedArticleHtml(article.content, previewSpaces)}</p>`;
  const contentBlocks = useMemo(() => splitHtmlIntoBlocks(contentHtml), [contentHtml]);
  const tags = (article.tags || [article.categoryLabel ?? article.category]).slice(0, 4);
  const relatedCards = related.slice(0, 2);
  const authorPath = article.authorUri ? normalizeEditorialUriToPath(article.authorUri) : null;
  const categoryPath = article.categoryUri ? normalizeEditorialUriToPath(article.categoryUri) : null;
  const canRenderInlineArticleAds = canRenderSlot(slots.articleInline) || true;
  const premiumLabel = useMemo(() => {
    if (article.minimumPlanRequired === "business") {
      return "Réservé Business";
    }
    if (article.minimumPlanRequired === "essentiel") {
      return "Réservé Essentiel";
    }
    return null;
  }, [article.minimumPlanRequired]);

  useEffect(() => {
    trackContentView("article");
  }, [article.slug]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = `2424:news:view:${article.slug}`;
    const now = Date.now();
    const lastSeen = window.localStorage.getItem(storageKey);
    if (lastSeen) {
      const parsed = Number.parseInt(lastSeen, 10);
      if (Number.isFinite(parsed) && now - parsed < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const articleBody = articleBodyRef.current;
    if (!articleBody || document.visibilityState !== "visible") {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let counted = false;
    let visible = false;

    const sendView = () => {
      if (counted || document.visibilityState !== "visible") {
        return;
      }

      counted = true;
      window.localStorage.setItem(storageKey, String(Date.now()));
      const body = JSON.stringify({ slug: article.slug, postId: article.postId });

      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/news/article/view", new Blob([body], { type: "application/json" }));
          return;
        }

        void fetch("/api/news/article/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      } catch {
        // Best effort only.
      }
    };

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = () => {
      clearTimer();
      if (visible && document.visibilityState === "visible" && !counted) {
        timer = setTimeout(sendView, 5000);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        schedule();
      },
      { threshold: 0 },
    );
    const onVisibilityChange = () => schedule();

    observer.observe(articleBody);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimer();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [article.postId, article.slug]);

  return (
    <>
      <FlashInfoBar />
      <div className="news-public-page bg-[var(--page-bg)] py-8">
        <div className="mx-auto max-w-[1320px] space-y-8 px-3 sm:px-4 lg:px-6">
        <article ref={articleBodyRef} className="mx-auto flex max-w-[676px] flex-col gap-5 lg:gap-6">
          {categoryPath ? (
            <Link
              href={categoryPath}
              className="inline-flex w-fit rounded-full bg-[#27624f] px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-85"
            >
              {article.categoryLabel ?? article.category}
            </Link>
          ) : (
            <div className="inline-flex w-fit rounded-full bg-[#27624f] px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
              {article.categoryLabel ?? article.category}
            </div>
          )}

          {!isNewsItem ? (
            <div className="overflow-hidden rounded-[12px]">
              <AppImage alt={article.title} src={image} responsiveSources={article.imageSources} sizes="(min-width: 1024px) 676px, 100vw" withLoader className="h-[260px] w-full object-cover sm:h-[360px] lg:h-[458px]" eager />
            </div>
          ) : null}

          <div className="text-[#171717] dark:text-[#f4f4f5]">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {!isNewsItem ? (
                <a
                  href="#article-comments"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#292929] px-2 py-1 transition-colors hover:border-[#27624f] hover:text-[#27624f] dark:border-[#6b6b6b]"
                >
                  {formatMetric(commentCount, "commentaires")}
                </a>
              ) : null}
              {categoryPath ? (
                <Link
                  href={categoryPath}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#292929] px-2 py-1 transition-colors hover:border-[#27624f] hover:text-[#27624f] dark:border-[#6b6b6b]"
                >
                  {article.categoryLabel ?? article.category}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#292929] px-2 py-1 dark:border-[#6b6b6b]">
                  {article.categoryLabel ?? article.category}
                </span>
              )}
              {premiumLabel ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#27624f] bg-[#fff5f5] px-2 py-1 text-[#27624f]">
                  {premiumLabel}
                </span>
              ) : null}
              <ArticleSaveButton
                article={article}
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#292929] transition hover:border-[#27624f] dark:border-[#6b6b6b]"
                iconClassName="h-4 w-4"
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-[25px] w-[25px] items-center justify-center rounded-full border border-[#27624f] bg-white text-[10px] font-bold text-[#27624f] dark:bg-[#171717]">
              24
            </div>
            <div>
              {authorPath ? (
                <Link href={authorPath} className="text-base font-bold leading-4 text-black hover:text-[#27624f] dark:text-white">
                  {article.authorName ?? "Tanyora Actualité & Reportages"}
                </Link>
              ) : (
                <p className="text-base font-bold leading-4 text-black dark:text-white">{article.authorName ?? "Tanyora Actualité & Reportages"}</p>
              )}
              <p className="mt-1 text-[10px] text-black dark:text-[#c8c8c8]">{formatDate(article.publishedAt)}</p>
            </div>
          </div>

          <h1 className="font-serif text-[26px] leading-[1.05] text-black dark:text-white sm:text-[32px] lg:text-[38px]">{article.title}</h1>

          <div className="space-y-4 text-[14px] leading-7 text-black dark:text-[#eeeeee]">
            <div className="space-y-4">
              {contentBlocks.map((block, index) => {
                const firstAdIndex = Math.max(0, articleInlineStartAfterBlocks - 1);
                const shouldRenderInlineAd =
                  canRenderInlineArticleAds &&
                  hasFullAccess &&
                  index >= firstAdIndex &&
                  (index === firstAdIndex || (index - firstAdIndex) % articleInlineRepeatEveryBlocks === 0);

                return (
                  <Fragment key={`${article.slug}-block-${index}`}>
                    <div
                      className="article-wysiwyg [&_p]:mb-4 [&_p]:leading-7 [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[18px] [&_h3]:font-semibold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#27624f] [&_blockquote]:pl-4 [&_img]:my-6 [&_img]:rounded-[12px] [&_img]:max-w-full [&_a]:text-[#27624f] [&_a]:underline-offset-2 hover:[&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: block }}
                    />
                    {shouldRenderInlineAd ? (
                      <AdSlot slotKey="articleInline" className="overflow-hidden rounded-[16px] border border-[#ececec] bg-[#fafafa] px-4 py-4 dark:border-[#383838] dark:bg-[#202020]" />
                    ) : null}
                  </Fragment>
                );
              })}
            </div>
          </div>

          {!hasFullAccess ? <ReadAccessGate minimumPlanRequired={article.minimumPlanRequired} /> : null}

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="ui-tag rounded-full border border-[#121212] px-3 py-1 text-[11px] font-medium text-[#121212] dark:border-[#6b6b6b] dark:text-[#f1f1f1]">
                {tag}
              </span>
            ))}
          </div>
        </article>

        {!isNewsItem ? (
          <div id="article-comments" className="mx-auto max-w-[676px] scroll-mt-24">
            <ArticleComments
              articleSlug={article.slug}
              articleId={article.postId}
              initialCommentCount={article.commentCount}
              commentsOpen={article.commentsOpen}
              hasFullAccess={hasFullAccess}
              minimumPlanRequired={article.minimumPlanRequired}
              onCountChange={setCommentCount}
            />
          </div>
        ) : null}

        <section className="mx-auto max-w-[676px] border-t border-[#dfdfdf] pt-8 dark:border-[#3d3d3d]">
          <h2 className="mb-5 text-[16px] font-bold uppercase tracking-wide text-[#27624f]">Articles similaires</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {relatedCards.map((item) => (
              <Link key={item.id} href={getEditorialArticlePath(item)} className="group space-y-3">
                {item.source === "post" ? (
                  <div className="overflow-hidden rounded-[12px]">
                    <AppImage
                      alt={item.title}
                      src={item.imageUrl || NEWS_IMAGE_PLACEHOLDER}
                      responsiveSources={item.imageSources}
                      sizes="(min-width: 768px) 326px, 100vw"
                      withLoader
                      className="h-[198px] w-full object-cover transition-transform duration-700 ease-[var(--motion-ease-standard)] group-hover:scale-[1.025]"
                    />
                  </div>
                ) : null}
                <div className="text-[12px] font-semibold text-[#121212] dark:text-[#e5e5e5]">{item.categoryLabel ?? item.category}</div>
                <div className="font-serif text-[18px] leading-tight text-black transition-colors duration-300 group-hover:text-[#27624f] dark:text-white">{item.title}</div>
                <p className="text-[12px] leading-6 text-[#222] dark:text-[#c8c8c8]">{stripHtml(item.excerpt || item.content).slice(0, 180)}...</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-[676px]">
          <Link className="inline-block text-sm font-semibold text-[#27624f] hover:underline" href={isNewsItem ? "/news" : "/actualites"}>
            {isNewsItem ? "Retour au fil d'info" : "Retour aux actualités"}
          </Link>
        </div>
        </div>
      </div>
    </>
  );
}


