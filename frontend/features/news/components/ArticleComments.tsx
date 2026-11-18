"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import type { NewsArticleCommentItem } from "@/lib/api/wordpress-internal";

type ArticleCommentsProps = {
  articleSlug: string;
  articleId?: number;
  initialCommentCount?: number;
  commentsOpen?: boolean;
  hasFullAccess: boolean;
  minimumPlanRequired?: "all" | "essentiel" | "business";
  onCountChange?: (count: number) => void;
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function ArticleComments({
  articleSlug,
  articleId,
  initialCommentCount = 0,
  commentsOpen = true,
  hasFullAccess,
  minimumPlanRequired = "all",
  onCountChange,
}: ArticleCommentsProps) {
  const { isLoggedIn, setShowLoginModal } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<NewsArticleCommentItem[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [remoteCommentsOpen, setRemoteCommentsOpen] = useState(commentsOpen);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      try {
        setIsLoading(true);
        const searchParams = new URLSearchParams();
        searchParams.set("slug", articleSlug);
        if (articleId) {
          searchParams.set("postId", String(articleId));
        }

        const response = await fetch(`/api/news/article/comments?${searchParams.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger les commentaires.");
        }

        if (!cancelled) {
          const nextCount = typeof payload.commentCount === "number" ? payload.commentCount : 0;
          setComments(Array.isArray(payload.items) ? payload.items : []);
          setCommentCount(nextCount);
          setRemoteCommentsOpen(Boolean(payload.commentsOpen));
          setError(null);
          onCountChange?.(nextCount);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Impossible de charger les commentaires.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [articleId, articleSlug, onCountChange]);

  const countLabel = useMemo(() => `${commentCount}`, [commentCount]);

  async function submitComment() {
    const content = draft.trim();
    if (!content || isSubmitting) {
      return;
    }

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/news/article/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: articleSlug,
          postId: articleId,
          content,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'envoyer le commentaire.");
      }

      if (payload.item) {
        setComments((prev) => [payload.item, ...prev]);
      }

      if (typeof payload.commentCount === "number") {
        setCommentCount(payload.commentCount);
        onCountChange?.(payload.commentCount);
      }

      if (typeof payload.commentsOpen === "boolean") {
        setRemoteCommentsOpen(payload.commentsOpen);
      }

      setDraft("");
      setSuccess(payload.message || "Commentaire envoyé.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible d'envoyer le commentaire.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderWriteState() {
    if (!remoteCommentsOpen) {
      return <p className="text-sm text-slate-500 dark:text-slate-400">{"Les commentaires sont fermés pour cet article."}</p>;
    }

    if (!isLoggedIn) {
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#3d3d3d] dark:bg-[#252525]">
          <p className="text-sm text-slate-700 dark:text-[#e5e5e5]">Connectez-vous pour laisser un commentaire.</p>
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="mt-3 rounded-xl bg-[#27624f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#b7191f]"
          >
            Se connecter
          </button>
        </div>
      );
    }

    if (!hasFullAccess) {
      const planLabel = minimumPlanRequired === "business" ? "Business" : "Essentiel";
      return (
        <div className="rounded-xl border border-[#F2C2C4] bg-[#fff7f7] p-4 dark:border-[#703337] dark:bg-[#321f20]">
          <p className="text-sm text-slate-700 dark:text-[#f1d5d5]">{`Lisez l'article avec l'accès ${planLabel} pour participer aux commentaires.`}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ajouter un commentaire"
          className="min-h-[110px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#27624f] dark:border-[#4a4a4a] dark:bg-[#202020] dark:text-white dark:placeholder:text-slate-500"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Votre commentaire sera visible après validation.</p>
          <button
            type="button"
            onClick={() => void submitComment()}
            disabled={isSubmitting || draft.trim().length === 0}
            className="rounded-xl bg-[#27624f] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b7191f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Envoi..." : "Publier"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#3d3d3d] dark:bg-[#202020] dark:text-white">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{`Commentaires (${countLabel})`}</h2>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{expanded ? "Masquer" : "Afficher"}</span>
      </button>

      {expanded ? (
        <div className="mt-4 space-y-4">
          {renderWriteState()}

          {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-[#3d3d3d] dark:text-slate-400">Chargement des commentaires...</div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <article key={comment.id} className="rounded-xl border border-slate-200 p-4 dark:border-[#3d3d3d]">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{comment.author}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(comment.date)}</p>
                  </div>
                  <p className="text-sm leading-6 text-slate-700 dark:text-[#d5d5d5]">{comment.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-[#3d3d3d] dark:text-slate-400">Aucun commentaire approuvé pour le moment.</div>
          )}
        </div>
      ) : null}
    </section>
  );
}
