"use client";

import { useMemo, useState } from "react";
import { ShareArrowIcon } from "@/components/ui/ShareArrowIcon";
import { ShareSheetModal } from "@/components/ui/ShareSheetModal";
import type { SavedItem, SavedItemKind } from "@/lib/saved-items/store";

type ProfileSavedPageProps = {
  initialItems: SavedItem[];
};

type SavedTab = {
  kind: SavedItemKind | "all";
  label: string;
};

const TABS: SavedTab[] = [
  { kind: "all", label: "Tout" },
  { kind: "article", label: "Article" },
  { kind: "job", label: "Offre d'Emploi" },
  { kind: "tender", label: "Appel d'Offre" },
  { kind: "classified", label: "Petites Annonces" },
  { kind: "directory", label: "Entreprises" },
  { kind: "radio", label: "Radio" },
];

const SAVED_ITEMS_PAGE_SIZE = 20;

function itemHref(item: SavedItem): string {
  if (item.kind === "article") {
    return item.slug ? `/${item.slug}` : "/actualites";
  }
  if (item.kind === "job") {
    return `/offres-emploi/${item.itemId}`;
  }
  if (item.kind === "tender") {
    return `/appels-offres/${item.itemId}`;
  }
  if (item.kind === "classified") {
    return `/petites-annonces/${item.slug || item.itemId}`;
  }
  if (item.kind === "directory") {
    return `/annuaire/${encodeURIComponent(item.itemId)}`;
  }
  return "/";
}

export function ProfileSavedPage({ initialItems }: ProfileSavedPageProps) {
  const [activeTab, setActiveTab] = useState<SavedItemKind | "all">("all");
  const [items, setItems] = useState<SavedItem[]>(initialItems);
  const [pendingKey, setPendingKey] = useState("");
  const [shareTarget, setShareTarget] = useState<{ title: string; url: string; text?: string } | null>(null);
  const [page, setPage] = useState(1);

  const visibleItems = useMemo(
    () => (activeTab === "all" ? items : items.filter((item) => item.kind === activeTab)),
    [activeTab, items],
  );
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / SAVED_ITEMS_PAGE_SIZE));
  const resolvedPage = Math.min(page, totalPages);
  const pagedItems = visibleItems.slice(
    (resolvedPage - 1) * SAVED_ITEMS_PAGE_SIZE,
    resolvedPage * SAVED_ITEMS_PAGE_SIZE,
  );

  async function handleRemove(item: SavedItem) {
    if (pendingKey) return;
    setPendingKey(item.key);
    try {
      const response = await fetch("/api/saved-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          item: {
            kind: item.kind,
            itemId: item.itemId,
            title: item.title,
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(payload?.items)) return;
      setItems(payload.items);
      if (resolvedPage > 1 && pagedItems.length === 1) {
        setPage(resolvedPage - 1);
      }
    } finally {
      setPendingKey("");
    }
  }

  async function handleShare(item: SavedItem) {
    const href = itemHref(item);
    const absoluteUrl =
      typeof window !== "undefined" ? `${window.location.origin}${href}` : href;
    setShareTarget({
      title: item.title,
      text: item.description || item.title,
      url: absoluteUrl,
    });
  }

  return (
    <main className="profile-saved-page ui-page px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1320px]">
        <section className="ui-card-flat rounded-[20px] p-4 md:p-6">
          <div className="ui-border mb-5 flex flex-wrap gap-3 border-b pb-4">
            {TABS.map((tab) => {
              const count = tab.kind === "all" ? items.length : items.filter((item) => item.kind === tab.kind).length;
              const active = tab.kind === activeTab;
              return (
                <button
                  key={tab.kind}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.kind);
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    active ? "bg-[#111111] text-white dark:bg-white dark:text-[#111111]" : "ui-text-main hover:bg-[var(--surface-3)]"
                  }`}
                >
                  {tab.label} {count > 0 ? `(${count})` : ""}
                </button>
              );
            })}
          </div>

          {visibleItems.length === 0 ? (
            <div className="ui-surface-soft ui-text-muted rounded-[16px] border border-dashed ui-border px-5 py-8 text-sm">
              {activeTab === "all" ? "Aucun element enregistre." : "Aucun element enregistre dans cet onglet."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {pagedItems.map((item) => (
                <article
                  key={item.key}
                  className="group ui-surface relative min-w-0 overflow-hidden rounded-[12px] p-[5px] transition-colors duration-300"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[12px] border-[2px] ui-border transition-colors duration-300 ease-in-out group-hover:border-[#27624f]"
                  />
                  <a href={itemHref(item)} className="block">
                    <div className="ui-surface-soft relative h-[170px] overflow-hidden rounded-[8px]">
                      <img
                        alt={item.title}
                        src={item.image || "/image-placeholder.png"}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </a>
                  <a href={itemHref(item)} className="mt-2 block px-[4px]">
                    <h3 className="ui-text-main line-clamp-3 text-[17px] font-semibold leading-[1.3]">
                      {item.title}
                    </h3>
                  </a>
                  <div className="mt-2 flex items-center gap-1 px-[2px] pb-[2px]">
                    <button
                      type="button"
                      onClick={() => {
                        void handleRemove(item);
                      }}
                      disabled={pendingKey === item.key}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#27624f] transition hover:bg-[#fff1f2] dark:hover:bg-[#332022] disabled:opacity-50"
                      aria-label="Supprimer des favoris"
                      title="Supprimer des favoris"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1 13h10l1-13M9 7V4h6v3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleShare(item);
                      }}
                      className="ui-text-main inline-flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[var(--hover-surface)]"
                      aria-label="Partager"
                    >
                      <ShareArrowIcon className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {visibleItems.length > SAVED_ITEMS_PAGE_SIZE ? (
            <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Pagination des favoris">
              <p className="ui-text-muted text-sm">Page {resolvedPage} sur {totalPages}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={resolvedPage === 1} className="rounded-xl border ui-border px-3 py-2 text-sm disabled:opacity-40">Précédent</button>
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={resolvedPage === totalPages} className="rounded-xl border ui-border px-3 py-2 text-sm disabled:opacity-40">Suivant</button>
              </div>
            </nav>
          ) : null}
        </section>
      </div>
      <ShareSheetModal
        open={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        title={shareTarget?.title || "Partager"}
        url={shareTarget?.url || (typeof window !== "undefined" ? window.location.href : "")}
        text={shareTarget?.text}
      />
    </main>
  );
}
