"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppImage } from "@/components/ui/AppImage";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";

type ConversationKind = "classified" | "job" | "tender";
type InboxTab = "all" | ConversationKind;

type MessageConversationCard = {
  id: string;
  kind: ConversationKind;
  listingId: number;
  listingTitle: string;
  listingImage: string;
  listingPrice: string;
  listingLocation: string;
  participantName: string;
  participantEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  conversationHref: string;
  listingHref: string;
};

type UnifiedConversation = MessageConversationCard & {
  directionLabel: "Reçu" | "Envoyé";
};

function getConversationFollowUpLabel(directionLabel: UnifiedConversation["directionLabel"]) {
  return directionLabel === "Reçu" ? "En attente de réponse" : "Votre réponse";
}

type MessagesDashboardPageProps = {
  receivedConversations: MessageConversationCard[];
  sentConversations: MessageConversationCard[];
  initialListingId?: number | null;
};

const TAB_LABELS: Record<InboxTab, string> = {
  all: "Tous",
  classified: "Petites annonces",
  job: "Offres d'emploi",
  tender: "Appels d'offres",
};

function formatConversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildConversationSearchValue(conversation: UnifiedConversation) {
  return [
    conversation.listingTitle,
    conversation.participantName,
    conversation.participantEmail,
    conversation.listingLocation,
    conversation.lastMessage,
    conversation.directionLabel,
    TAB_LABELS[conversation.kind],
  ]
    .join(" ")
    .toLowerCase();
}

function EmptyInbox({ activeTab }: { activeTab: InboxTab }) {
  const contentLabel = TAB_LABELS[activeTab];
  const title =
    activeTab === "all"
      ? "Aucune conversation pour le moment"
      : `Aucune conversation dans ${contentLabel.toLowerCase()}`;
  const description =
    activeTab === "all"
      ? "Dès qu'un échange démarre autour d'une petite annonce, d'une offre d'emploi ou d'un appel d'offres, vous retrouverez ici toute votre messagerie."
      : `Dès qu'un échange démarre autour de ${contentLabel.toLowerCase()}, il apparaîtra dans cet onglet.`;

  return (
    <div className="ui-surface-soft flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed ui-border px-6 py-10 text-center">
      <p className="ui-text-main text-[22px] font-semibold">{title}</p>
      <p className="ui-text-muted mt-3 max-w-[56ch] text-[14px] leading-[1.8]">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/petites-annonces"
          className="inline-flex items-center justify-center rounded-[14px] bg-[#111111] px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-[#27624f] dark:bg-white dark:text-[#111111] dark:hover:bg-[#f1f1f1]"
        >
          Voir les publications
        </Link>
        <Link
          href="/profil/petites-annonces"
          className="ui-surface ui-text-main inline-flex items-center justify-center rounded-[14px] border ui-border px-4 py-3 text-[13px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
        >
          Gérer mes contenus
        </Link>
      </div>
    </div>
  );
}

function tabCount(items: UnifiedConversation[], tab: InboxTab) {
  if (tab === "all") {
    return items.length;
  }
  return items.filter((item) => item.kind === tab).length;
}

export function MessagesDashboardPage({
  receivedConversations,
  sentConversations,
  initialListingId = null,
}: MessagesDashboardPageProps) {
  const conversations = useMemo<UnifiedConversation[]>(
    () =>
      [
        ...receivedConversations.map((conversation) => ({
          ...conversation,
          directionLabel: "Reçu" as const,
        })),
        ...sentConversations.map((conversation) => ({
          ...conversation,
          directionLabel: "Envoyé" as const,
        })),
      ].sort((left, right) => {
        if (initialListingId) {
          const leftMatches = left.listingId === initialListingId ? 1 : 0;
          const rightMatches = right.listingId === initialListingId ? 1 : 0;
          if (leftMatches !== rightMatches) {
            return rightMatches - leftMatches;
          }
        }

        return new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime();
      }),
    [initialListingId, receivedConversations, sentConversations],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<InboxTab>("all");

  const filteredConversations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const tabScoped =
      activeTab === "all" ? conversations : conversations.filter((conversation) => conversation.kind === activeTab);

    if (!normalizedQuery) {
      return tabScoped;
    }

    return tabScoped.filter((conversation) => buildConversationSearchValue(conversation).includes(normalizedQuery));
  }, [activeTab, conversations, searchQuery]);

  const inboxStats = useMemo(
    () => ({
      total: conversations.length,
      received: receivedConversations.length,
      sent: sentConversations.length,
    }),
    [conversations.length, receivedConversations.length, sentConversations.length],
  );

  return (
    <main className="profile-messages-page ui-page px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-[1380px] space-y-5">
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">Messagerie</p>
            <h1 className="ui-text-main mt-2 text-[2rem] font-semibold tracking-[-0.03em] md:text-[2.25rem]">Mes messages</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <span className="ui-surface-soft ui-text-main rounded-full border ui-border px-3 py-1.5">
              {inboxStats.total} conversation{inboxStats.total > 1 ? "s" : ""}
            </span>
            <span className="ui-surface-soft ui-text-main rounded-full border ui-border px-3 py-1.5">
              {inboxStats.received} reçue{inboxStats.received > 1 ? "s" : ""}
            </span>
            <span className="ui-surface-soft ui-text-main rounded-full border ui-border px-3 py-1.5">
              {inboxStats.sent} envoyée{inboxStats.sent > 1 ? "s" : ""}
            </span>
          </div>
        </section>

        <section className="ui-card rounded-[24px] p-4 md:p-5">
          <div className="flex flex-col gap-3 border-b ui-border pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["all", "classified", "job", "tender"] as const).map((tab) => {
                const isActive = tab === activeTab;
                const count = tabCount(conversations, tab);
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                      isActive ? "bg-[#111111] text-white dark:bg-white dark:text-[#111111]" : "ui-text-main hover:bg-[var(--surface-3)]"
                    }`}
                  >
                    {TAB_LABELS[tab]} {count > 0 ? `(${count})` : ""}
                  </button>
                );
              })}
            </div>

            <div className="ui-surface-soft w-full rounded-[16px] border ui-border px-4 py-2.5 lg:max-w-[320px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`Rechercher dans ${TAB_LABELS[activeTab].toLowerCase()}...`}
                className="ui-text-main w-full bg-transparent text-[14px] outline-none placeholder:text-[color:var(--text-soft)]"
              />
            </div>
          </div>
        </section>

        {filteredConversations.length === 0 ? (
          <EmptyInbox activeTab={activeTab} />
        ) : (
          <section className="ui-card rounded-[28px] p-4 md:p-5">
            <div className="border-b ui-border pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Boîte de réception</p>
              <p className="ui-text-muted mt-3 text-sm leading-6">
                {activeTab === "all" ? "Toutes vos conversations en une seule liste." : `Conversations liées à ${TAB_LABELS[activeTab].toLowerCase()}.`}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {filteredConversations.map((conversation) => (
                <article
                  key={conversation.id}
                  className="ui-surface-soft rounded-[24px] border ui-border p-4 transition hover:border-[#27624f] hover:bg-[var(--surface-1)] md:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="ui-surface-muted h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[18px]">
                          <AppImage src={conversation.listingImage} alt={conversation.listingTitle} className="h-full w-full object-cover" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-[#27624f]/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#27624f]">
                              {conversation.directionLabel}
                            </span>
                            <span className="inline-flex rounded-full bg-[#111111]/6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ui-text-muted dark:bg-white/10">
                              {getConversationFollowUpLabel(conversation.directionLabel)}
                            </span>
                            <span className="ui-surface rounded-full border ui-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ui-text-muted">
                              {TAB_LABELS[conversation.kind]}
                            </span>
                            <span className="ui-surface rounded-full border ui-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ui-text-muted">
                              {conversation.messageCount} message{conversation.messageCount > 1 ? "s" : ""}
                            </span>
                            <span className="ui-text-soft text-[11px]">{formatConversationDate(conversation.lastMessageAt)}</span>
                          </div>

                          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <p className="ui-text-main text-[20px] font-semibold leading-[1.2]">
                                {conversation.participantName || conversation.participantEmail}
                              </p>
                              <p className="ui-text-muted mt-1 text-[13px]">{conversation.participantEmail}</p>
                            </div>

                            <div className="ui-text-muted flex flex-wrap items-center gap-3 text-[13px] md:justify-end">
                              <span>{conversation.listingTitle}</span>
                              <span className="h-1 w-1 rounded-full bg-[#C5C7CE]" />
                              <span>{formatListingMoney(conversation.listingPrice, "MGA") || conversation.listingPrice || "-"}</span>
                              <span className="h-1 w-1 rounded-full bg-[#C5C7CE]" />
                              <span>{conversation.listingLocation || "Madagascar"}</span>
                            </div>
                          </div>

                          <p className="ui-text-main mt-4 line-clamp-2 text-[15px] leading-[1.75]">{conversation.lastMessage}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:shrink-0">
                      <Link
                        href={conversation.conversationHref}
                        className="inline-flex items-center justify-center rounded-[14px] bg-[#111111] px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-[#27624f] dark:bg-white dark:text-[#111111] dark:hover:bg-[#f1f1f1]"
                      >
                        Ouvrir la messagerie
                      </Link>
                      <Link
                        href={conversation.listingHref}
                        className="ui-surface ui-text-main inline-flex items-center justify-center rounded-[14px] border ui-border px-4 py-3 text-[13px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                      >
                        Voir la publication
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}




