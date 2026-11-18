"use client";

import Link from "next/link";
import { Bookmark, MessageCircle } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";

import { useAuth } from "@/features/prototype/app/context/AuthContext";
import type { NewsArticle } from "@/features/news/types";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";

type ArticleCardActionsProps = {
  article: NewsArticle;
  className?: string;
};

type ArticleSaveButtonProps = {
  article: NewsArticle;
  className?: string;
  iconClassName?: string;
};

export function ArticleSaveButton({ article, className = "", iconClassName = "h-3.5 w-3.5" }: ArticleSaveButtonProps) {
  const { isLoggedIn, setShowLoginModal } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!isLoggedIn) {
      setIsSaved(false);
      return;
    }

    void fetch(`/api/saved-items?kind=article&itemId=${encodeURIComponent(String(article.id))}`, { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled) {
          setIsSaved(Boolean(payload?.saved));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsSaved(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [article.id, isLoggedIn]);

  async function handleToggleSaved(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/saved-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          item: {
            kind: "article",
            itemId: String(article.id),
            slug: article.slug,
            title: article.title,
            description: article.excerpt,
            image: article.imageUrl,
            sourceLabel: article.categoryLabel ?? article.category,
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (response.ok) {
        setIsSaved(Boolean(payload?.saved));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggleSaved}
      aria-label={isSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isSaved}
      title={isSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
      disabled={isSaving}
      className={`transition-colors duration-300 hover:text-[#27624f] disabled:cursor-wait ${isSaved ? "text-[#27624f]" : "text-[var(--text-soft)]"} ${className}`}
    >
      <Bookmark className={iconClassName} fill={isSaved ? "currentColor" : "none"} />
    </button>
  );
}

export function ArticleCardActions({ article, className = "" }: ArticleCardActionsProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <ArticleSaveButton article={article} />
      {article.source === "post" ? (
        <Link
          href={`${getEditorialArticlePath(article)}#article-comments`}
          aria-label="Voir les commentaires"
          className="text-[var(--text-soft)] transition-colors duration-300 hover:text-[#27624f]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
