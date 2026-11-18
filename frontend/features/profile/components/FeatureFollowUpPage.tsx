"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppImage } from "@/components/ui/AppImage";
import type { FollowUpItem, WorkspaceListItem } from "@/features/profile/workspace-mocks";

type FeatureFollowUpPageProps = {
  eyebrow: string;
  title: string;
  backHref: string;
  backLabel: string;
  item: WorkspaceListItem;
  itemImageFallbackSrc?: string;
  followUpLabel: string;
  entries: FollowUpItem[];
};

const STATUS_OPTIONS = [
  { id: "all", label: "Tous" },
  { id: "new", label: "Nouveaux" },
] as const;

function statusBadgeClass(status: FollowUpItem["status"]) {
  if (status === "new") {
    return "bg-[#FFF1F1] text-[#27624f]";
  }

  if (status === "reviewed") {
    return "bg-[#EEF4FF] text-[#2F57D9]";
  }

  return "bg-[#F4F4F4] text-[#666]";
}

function statusLabel(status: FollowUpItem["status"]) {
  if (status === "new") return "Nouveau";
  if (status === "reviewed") return "Relu";
  return "Archivé";
}

export function FeatureFollowUpPage({
  eyebrow,
  title,
  backHref,
  backLabel,
  item,
  itemImageFallbackSrc,
  followUpLabel,
  entries,
}: FeatureFollowUpPageProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]["id"]>("all");

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesStatus = status === "all" ? true : entry.status === status;
      const haystack = `${entry.title} ${entry.description} ${entry.meta}`.toLowerCase();
      const matchesQuery = normalizedQuery ? haystack.includes(normalizedQuery) : true;
      return matchesStatus && matchesQuery;
    });
  }, [entries, query, status]);

  return (
    <main className="ui-page px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1320px] space-y-8">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,_#111111,_#2b2b2b)] p-8 text-white md:p-10">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb6b8]">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="mt-4 max-w-[58ch] text-sm leading-7 text-white/78 md:text-base">
            Suivez cet élément en détail, filtrez les réponses et gardez une vue claire même quand le volume augmente.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={backHref}
              className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-[#111]"
            >
              {backLabel}
            </Link>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <article className="ui-card rounded-[28px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Élément</p>
            <h2 className="ui-text-main mt-3 text-2xl font-semibold">{item.title}</h2>
            <p className="ui-text-muted mt-3 text-sm leading-6">{item.description}</p>
            <p className="ui-text-soft mt-3 text-xs uppercase tracking-[0.16em]">{item.meta}</p>

            {item.image || itemImageFallbackSrc ? (
              <div className="ui-surface-soft ui-border mt-5 overflow-hidden rounded-[22px] border">
                <AppImage alt="" src={item.image || itemImageFallbackSrc} className="h-60 w-full object-cover" />
              </div>
            ) : null}
          </article>

          <section className="ui-card rounded-[28px] p-6">
            <div className="flex flex-col gap-4 border-b ui-border pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Suivi</p>
                <h2 className="ui-text-main mt-3 text-2xl font-semibold">{followUpLabel}</h2>
              </div>
              <span className="ui-surface-soft ui-text-muted rounded-full px-3 py-1 text-xs font-semibold">
                {filteredEntries.length} élément{filteredEntries.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => {
                  const isActive = option.id === status;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setStatus(option.id)}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#111] text-white dark:bg-white dark:text-[#111]"
                          : "ui-surface-soft ui-text-muted hover:bg-[var(--surface-4)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <label className="block w-full lg:max-w-[320px]">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="ui-input w-full rounded-2xl px-4 py-3 text-sm"
                  placeholder="Rechercher un nom, un message, une information..."
                />
              </label>
            </div>

            <div className="mt-6 space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="ui-surface-soft ui-border ui-text-muted rounded-[22px] border border-dashed px-5 py-8 text-sm leading-6">
                  Aucun élément ne correspond à votre recherche pour le moment.
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <article key={entry.id} className="ui-surface-soft ui-border rounded-[22px] border p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="ui-text-main text-base font-semibold">{entry.title}</h3>
                        <p className="ui-text-muted mt-2 text-sm leading-6">{entry.description}</p>
                        <p className="ui-text-soft mt-3 text-xs uppercase tracking-[0.16em]">{entry.meta}</p>
                        {entry.conversationHref ? (
                          <div className="mt-4">
                            <Link
                              href={entry.conversationHref}
                              className="inline-flex items-center justify-center rounded-2xl bg-[#111] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#27624f] dark:bg-white dark:text-[#111] dark:hover:bg-[var(--surface-3)]"
                            >
                              {entry.actionLabel || "Ouvrir la discussion"}
                            </Link>
                          </div>
                        ) : null}
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(entry.status)}`}>
                        {statusLabel(entry.status)}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
