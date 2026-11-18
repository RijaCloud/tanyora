"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { MapPin } from "lucide-react";
import { AppImage } from "@/components/ui/AppImage";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { ClassifiedGridCard } from "@/features/prototype/components/ClassifiedGridCard";
import { Link } from "@/features/prototype/router-compat";
import { extractPlainTextFromListingHtml } from "@/lib/content/listing-html";
import { buildListingSlug } from "@/lib/listings/slug";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";
import { getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";

type SearchKind = "article" | "classified" | "job" | "tender" | "directory";

type PublicSearchItem = {
  id: number | string;
  title: string;
  description?: string;
  content?: string;
  excerpt?: string;
  location?: string;
  category?: string;
  categoryLabel?: string;
  type?: string;
  price?: string;
  budget?: string;
  currency?: string;
  image?: string;
  imageUrl?: string;
  companyName?: string;
  publisherName?: string;
  companyLogo?: string;
  profilePhoto?: string;
  deadline?: string;
  slug?: string;
  source?: "post" | "news";
  publishedAt?: string;
};

type SearchResult = {
  kind: SearchKind;
  id: string;
  title: string;
  description: string;
  meta: string;
  href: string;
  item: PublicSearchItem;
};

type GlobalSearchOverlayProps = {
  open: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  initialKind?: SearchKind | "all";
};

type GlobalSearchResponse = {
  groups?: Partial<Record<SearchKind, PublicSearchItem[]>>;
};

const SEARCH_GROUPS: Array<{
  kind: SearchKind;
  label: string;
  slugPrefix?: "annonce" | "offre" | "appel-offres";
  pathPrefix: string;
}> = [
  {
    kind: "article",
    label: "Actualités",
    pathPrefix: "/actualites",
  },
  {
    kind: "classified",
    label: "Petites annonces",
    slugPrefix: "annonce",
    pathPrefix: "/petites-annonces",
  },
  {
    kind: "job",
    label: "Offres d'emploi",
    slugPrefix: "offre",
    pathPrefix: "/offres-emploi",
  },
  {
    kind: "tender",
    label: "Appels d'offres",
    slugPrefix: "appel-offres",
    pathPrefix: "/appels-offres",
  },
  {
    kind: "directory",
    label: "Annuaire",
    pathPrefix: "/annuaire",
  },
];

function getResultMeta(kind: SearchKind, item: PublicSearchItem) {
  if (kind === "article") {
    const publishedAt = item.publishedAt
      ? new Intl.DateTimeFormat("fr-MG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(item.publishedAt))
      : "";
    return [item.categoryLabel || item.category, publishedAt].filter(Boolean).join(" - ");
  }

  const bits = [
    kind === "classified"
      ? formatListingMoney(item.price || "", item.currency)
      : kind === "tender"
        ? formatListingMoney(item.budget || "", item.currency)
        : kind === "directory"
          ? item.category
          : item.type || item.category,
    item.location,
    kind === "directory" ? undefined : item.category,
  ].filter(Boolean);

  return bits.join(" - ");
}

function toSearchResult(group: (typeof SEARCH_GROUPS)[number], item: PublicSearchItem): SearchResult {
  const title = item.title || "Publication";
  const description = extractPlainTextFromListingHtml(item.excerpt || item.content || item.description || "").slice(0, 180);
  const href =
    group.kind === "article" && item.slug
      ? getEditorialArticlePath({ slug: item.slug, source: item.source || "post" })
      : group.kind === "directory"
      ? `${group.pathPrefix}/${encodeURIComponent(String(item.id))}`
      : `${group.pathPrefix}/${buildListingSlug(item.id, title, group.slugPrefix || "annonce")}`;

  return {
    kind: group.kind,
    id: String(item.id),
    title,
    description,
    meta: getResultMeta(group.kind, item),
    href,
    item,
  };
}

function SearchTenderCard({ result, onOpen }: { result: SearchResult; onOpen: () => void }) {
  const item = result.item;
  const organization = item.publisherName || item.companyName || "Organisation";
  const budget = formatListingMoney(item.budget || "", item.currency) || item.budget;

  return (
    <a
      className="group ui-surface relative block h-[216px] min-w-0 overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card"
      href={result.href}
      onClick={onOpen}
    >
      <div aria-hidden="true" className="ui-border absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 group-hover:border-[#27624f]" />
      <div className="flex h-full flex-col justify-between gap-5 p-[5px]">
        <div className="flex h-full flex-col justify-between px-3.5 py-3.5">
          <div className="flex min-w-0 items-start gap-3">
            {item.companyLogo ? (
              <AppImage alt={organization} className="h-[38px] w-[38px] shrink-0 rounded-[10px] border border-[color:var(--border-soft)] bg-white p-1 object-contain" src={item.companyLogo} />
            ) : (
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#27624f] text-sm font-bold text-white">
                {organization.slice(0, 1).toUpperCase()}
              </span>
            )}
            <p className="ui-text-main line-clamp-2 min-w-0 pt-1 text-[14px] font-bold leading-[1.2]">{organization}</p>
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-[var(--text-soft)]">
              <MapPin className="h-3 w-3 shrink-0 text-[#27624f]" />
              <span className="truncate">{item.location}</span>
            </div>
            <p className="ui-text-main line-clamp-2 text-[14px] font-semibold leading-[1.25]">{result.title}</p>
            {budget ? <p className="text-[13px] font-bold text-[#27624f]">{budget}</p> : null}
            {item.deadline ? <p className="ui-text-muted text-[10px]">Date limite : {item.deadline}</p> : null}
          </div>
        </div>
      </div>
    </a>
  );
}

function SearchDirectoryCard({ result, onOpen }: { result: SearchResult; onOpen: () => void }) {
  const item = result.item;
  const company = item.publisherName || item.companyName || result.title;
  const initial = company.slice(0, 1).toUpperCase() || "E";

  return (
    <a
      className="group ui-surface relative block h-[240px] min-w-0 overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card"
      href={result.href}
      onClick={onOpen}
    >
      <div aria-hidden="true" className="ui-border absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 group-hover:border-[#27624f]" />
      <div className="flex h-full flex-col gap-4 p-[5px]">
        <div className="relative h-[132px] shrink-0 overflow-hidden rounded-[6px]">
          {item.image ? (
            <AppImage alt={company} className="h-full w-full object-cover" src={item.image} />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#111111,#4b5563)] text-5xl font-semibold text-white">{initial}</div>
          )}
        </div>
        <div className="min-w-0 px-3.5 pb-3.5">
          <p className="ui-text-main line-clamp-2 text-[14px] font-bold leading-[1.18]">{company}</p>
          <p className="mt-1 line-clamp-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#27624f]">{item.category || "Entreprise"}</p>
          <p className="ui-text-soft mt-1 line-clamp-2 text-[11px] leading-[1.45]">{item.location}</p>
        </div>
      </div>
    </a>
  );
}

function SearchArticleCard({ result, onOpen }: { result: SearchResult; onOpen: () => void }) {
  const item = result.item;

  return (
    <a className="group relative block h-[220px] overflow-hidden rounded-[20px] bg-[#171717]" href={result.href} onClick={onOpen}>
      <AppImage alt="" className="absolute inset-0 h-full w-full object-cover opacity-65 transition-transform duration-500 group-hover:scale-[1.025]" src={item.imageUrl || item.image || "/image-placeholder.png"} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
      <div className="relative flex h-full flex-col justify-end p-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">{item.categoryLabel || item.category || "Actualité"}</p>
        <p className="mt-2 line-clamp-3 text-[18px] font-bold leading-[1.08] tracking-[-0.03em]">{result.title}</p>
      </div>
    </a>
  );
}

function SearchJobListCard({ result, onOpen }: { result: SearchResult; onOpen: () => void }) {
  const item = result.item;
  const company = item.companyName || item.publisherName || "Entreprise";
  const initial = company.slice(0, 1).toUpperCase() || "E";
  const deadline = item.deadline ? new Date(item.deadline) : null;
  const isClosed = deadline ? deadline.getTime() < Date.now() : false;
  const statusLabel = isClosed ? "Fermé" : "Ouvert";
  const formattedDeadline = deadline && !Number.isNaN(deadline.getTime())
    ? new Intl.DateTimeFormat("fr-MG", { day: "2-digit", month: "2-digit", year: "numeric" }).format(deadline)
    : "";

  return (
    <Link
      to={result.href}
      onClick={onOpen}
      className="group flex w-full rounded-[12px] border border-transparent bg-transparent p-2.5 text-left transition-colors duration-300 hover:border-[var(--border-soft)] hover:bg-[var(--surface-2)]"
    >
      <div className="flex w-full items-center gap-3">
        {item.companyLogo ? (
          <AppImage alt={company} className="h-10 w-10 shrink-0 rounded-[10px] border border-[color:var(--border-soft)] bg-white p-1 object-contain" src={item.companyLogo} />
        ) : (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#27624f] text-sm font-bold text-white">{initial}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="ui-text-main truncate text-[11px] font-semibold leading-tight">{company}</span>
            <span className={`inline-flex shrink-0 items-center gap-1 text-[9px] font-medium ${isClosed ? "text-[#27624f]" : "text-[#15803d]"}`}>
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${isClosed ? "bg-[#27624f]" : "bg-[#22c55e]"}`} />
              {statusLabel}
            </span>
          </div>
          <div className="mt-0.5 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <h4 className="ui-text-main min-w-0 flex-1 truncate text-[16px] font-semibold leading-tight">{result.title}</h4>
            <div className="flex min-w-0 items-center gap-3 text-[10px] leading-tight text-[var(--text-soft)]">
              {item.location ? <span className="flex min-w-0 items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" strokeWidth={1.8} /><span className="truncate">{item.location}</span></span> : null}
              {formattedDeadline ? <span className="shrink-0 font-medium text-[#b42318]">{formattedDeadline}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SearchResultCard({ result, onOpen }: { result: SearchResult; onOpen: () => void }) {
  const item = result.item;

  if (result.kind === "classified") {
    return <ClassifiedGridCard className="w-full" href={result.href} image={item.image} location={item.location} onClick={onOpen} price={formatListingMoney(item.price || "", item.currency) || item.price} title={result.title} />;
  }

  if (result.kind === "job") {
    return <SearchJobListCard onOpen={onOpen} result={result} />;
  }

  if (result.kind === "tender") {
    return <SearchTenderCard onOpen={onOpen} result={result} />;
  }

  if (result.kind === "directory") {
    return <SearchDirectoryCard onOpen={onOpen} result={result} />;
  }

  return <SearchArticleCard onOpen={onOpen} result={result} />;
}

type GlobalSearchSuggestionsProps = {
  open: boolean;
  query: string;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onShowAll: (kind: SearchKind) => void;
};

export function GlobalSearchSuggestions({ open, query, anchorRef, onClose, onShowAll }: GlobalSearchSuggestionsProps) {
  const { userPlan } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const normalizedQuery = query.trim();
  const availableSearchGroups = useMemo(
    () => SEARCH_GROUPS.filter((group) => (group.kind === "tender" ? userPlan === "business" : true)),
    [userPlan],
  );

  useEffect(() => {
    if (!open || normalizedQuery.length < 2) {
      setResults([]);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch(`/api/public/search?q=${encodeURIComponent(normalizedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as GlobalSearchResponse | null;
        if (!response.ok || !payload?.groups) {
          throw new Error("global-search-unavailable");
        }
        setResults(
          availableSearchGroups.flatMap((group) => {
            const items = payload.groups?.[group.kind];
            return Array.isArray(items) ? items.map((item) => toSearchResult(group, item)) : [];
          }),
        );
      } catch {
        if (!controller.signal.aborted) {
          setErrorMessage("Impossible de lancer la recherche pour le moment.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [availableSearchGroups, normalizedQuery, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !anchorRef.current?.contains(event.target)) {
        onClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, onClose, open]);

  const groupedResults = useMemo(
    () => availableSearchGroups.map((group) => ({ ...group, results: results.filter((result) => result.kind === group.kind) })),
    [availableSearchGroups, results],
  );

  if (!open || normalizedQuery.length < 2) return null;

  return (
    <div className="global-search-suggestions ui-card absolute z-[190] mt-2 w-[min(760px,calc(100vw-2rem))] overflow-hidden rounded-[20px] border ui-border shadow-[0_22px_50px_rgba(17,17,17,0.2)]" role="dialog" aria-label="Résultats de recherche">
      <div className="max-h-[min(68vh,640px)] overflow-y-auto p-3 sm:p-4">
        {isLoading ? <p className="ui-text-muted px-2 py-4 text-sm">Recherche...</p> : null}
        {errorMessage ? <p className="rounded-[12px] bg-[#fff4f5] px-3 py-2 text-sm text-[#9f1f28] dark:bg-[#2a1c1f] dark:text-[#ffb9bf]">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && results.length === 0 ? <p className="ui-text-muted px-2 py-4 text-sm">Aucun résultat public ne correspond à votre recherche.</p> : null}
        {!isLoading && !errorMessage && results.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {groupedResults.map((group) =>
              group.results.length > 0 ? (
                <section key={group.kind} className="ui-surface-soft rounded-[14px] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="ui-text-main text-[11px] font-bold uppercase tracking-[0.14em]">{group.label}</h3>
                    <button type="button" onClick={() => onShowAll(group.kind)} className="shrink-0 text-[11px] font-semibold text-[var(--brand-red)] hover:underline">
                      Voir les {group.results.length}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {group.results.slice(0, 3).map((result) => (
                      <Link key={`${result.kind}-${result.id}`} to={result.href} onClick={onClose} className="block rounded-[10px] px-2 py-2 transition-colors hover:bg-[var(--surface-3)]">
                        <p className="ui-text-main truncate text-sm font-semibold">{result.title}</p>
                        <p className="ui-text-soft mt-0.5 truncate text-[11px]">{result.meta || result.description}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null,
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function GlobalSearchOverlay({ open, query, onQueryChange, onClose, initialKind = "all" }: GlobalSearchOverlayProps) {
  const { userPlan } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeKind, setActiveKind] = useState<SearchKind | "all">(initialKind);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedQuery = query.trim();
  const availableSearchGroups = useMemo(
    () => SEARCH_GROUPS.filter((group) => (group.kind === "tender" ? userPlan === "business" : true)),
    [userPlan],
  );
  const searchPlaceholder = useMemo(() => {
    const suggestions = availableSearchGroups.map((group) => {
      if (group.kind === "classified") return "une annonce";
      if (group.kind === "article") return "un article";
      if (group.kind === "job") return "une offre";
      if (group.kind === "tender") return "un appel d'offres";
      return "une entreprise";
    });

    return suggestions.length > 0 ? `Rechercher ${suggestions.join(", ")}...` : "Rechercher un contenu...";
  }, [availableSearchGroups]);

  useEffect(() => {
    if (open) {
      setActiveKind(initialKind);
    }
  }, [initialKind, open]);

  useEffect(() => {
    if (activeKind === "all") {
      return;
    }

    if (!availableSearchGroups.some((group) => group.kind === activeKind)) {
      setActiveKind("all");
    }
  }, [activeKind, availableSearchGroups]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (normalizedQuery.length < 2) {
      setResults([]);
      setActiveKind("all");
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`/api/public/search?q=${encodeURIComponent(normalizedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as GlobalSearchResponse | null;
        if (!response.ok || !payload?.groups) {
          throw new Error("global-search-unavailable");
        }

        setResults(
          availableSearchGroups.flatMap((group) => {
            const items = payload.groups?.[group.kind];
            return Array.isArray(items) ? items.map((item) => toSearchResult(group, item)) : [];
          }),
        );
      } catch {
        if (!controller.signal.aborted) {
          setErrorMessage("Impossible de lancer la recherche pour le moment.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [availableSearchGroups, normalizedQuery, open]);

  const groupedResults = useMemo(
    () =>
      availableSearchGroups.map((group) => ({
        ...group,
        results: results.filter((result) => result.kind === group.kind),
      })),
    [availableSearchGroups, results],
  );

  const visibleGroups = useMemo(
    () => groupedResults.filter((group) => activeKind === "all" || group.kind === activeKind),
    [activeKind, groupedResults],
  );

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-4 backdrop-blur-sm sm:px-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mx-auto my-auto flex w-full max-w-[980px] flex-col rounded-[28px]">
        <div
          className="ui-card relative overflow-hidden rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,0.28)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-[#111111] shadow-lg transition-colors hover:bg-gray-100"
            aria-label="Fermer la recherche"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </button>
          <div className="border-b ui-border p-5 sm:p-6">
            <div className="flex items-start gap-4 pr-14">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#27624f]">Recherche</p>
                <h2 className="ui-text-main mt-2 text-2xl font-semibold">Que recherchez-vous ?</h2>
                <p className="ui-text-muted mt-2 text-sm leading-6">
                  Actualités, annonces, emplois et entreprises.
                </p>
              </div>
            </div>

            <div className="global-search-field mt-5 flex min-h-[54px] items-center gap-3 rounded-[18px] border ui-border-strong bg-[var(--surface-2)] px-4">
              <svg className="h-5 w-5 shrink-0 text-[color:var(--text-soft)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16L21 21" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="global-search-input ui-text-main h-[52px] min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[color:var(--text-soft)]"
              />
              {isLoading ? <span className="ui-text-muted text-xs">Recherche...</span> : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveKind("all")}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  activeKind === "all"
                    ? "bg-[var(--brand-red)] text-white"
                    : "border ui-border bg-[var(--surface-2)] text-[var(--brand-red)] hover:bg-[var(--surface-3)]"
                }`}
              >
                Tous ({results.length})
              </button>
              {availableSearchGroups.map((group) => {
                const groupCount = groupedResults.find((entry) => entry.kind === group.kind)?.results.length || 0;
                const isActive = activeKind === group.kind;
                return (
                  <button
                    key={group.kind}
                    type="button"
                    onClick={() => setActiveKind(group.kind)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      isActive
                        ? "bg-[var(--brand-red)] text-white"
                        : "border ui-border bg-[var(--surface-2)] text-[var(--brand-red)] hover:bg-[var(--surface-3)]"
                    }`}
                  >
                    {group.label} ({groupCount})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[58vh] overflow-y-auto p-5 sm:p-6">
            {errorMessage ? (
              <div className="rounded-[18px] border border-[#f1b8bd] bg-[#fff4f5] px-4 py-3 text-sm text-[#9f1f28] dark:border-[#5a2f34] dark:bg-[#2a1c1f] dark:text-[#ffb9bf]">
                {errorMessage}
              </div>
            ) : null}

            {normalizedQuery.length < 2 ? (
              <div className="ui-surface-soft ui-text-muted rounded-[22px] p-6 text-sm leading-7">
                Saisissez au moins 2 caractères pour lancer la recherche.
              </div>
            ) : !isLoading && results.length === 0 ? (
              <div className="ui-surface-soft ui-text-muted rounded-[22px] p-6 text-sm leading-7">
                Aucun résultat public ne correspond à votre recherche pour le moment.
              </div>
            ) : !isLoading && visibleGroups.every((group) => group.results.length === 0) ? (
              <div className="ui-surface-soft ui-text-muted rounded-[22px] p-6 text-sm leading-7">
                Aucun résultat disponible pour ce type de contenu.
              </div>
            ) : (
              <div className="space-y-6">
                {visibleGroups.map((group) => {
                  if (group.results.length === 0) {
                    return null;
                  }

                  const isOverview = activeKind === "all";
                  const displayedResults = isOverview ? group.results.slice(0, 3) : group.results;
                  const hasMoreResults = isOverview && group.results.length > displayedResults.length;

                  return (
                    <section key={group.kind}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="ui-text-main text-sm font-bold uppercase tracking-[0.16em]">{group.label}</h3>
                        <span className="ui-text-soft text-xs">{group.results.length} résultat{group.results.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className={group.kind === "job" ? "space-y-1" : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
                        {displayedResults.map((result) => (
                          <SearchResultCard key={`${result.kind}-${result.id}`} onOpen={onClose} result={result} />
                        ))}
                      </div>
                      {hasMoreResults ? (
                        <button
                          type="button"
                          onClick={() => setActiveKind(group.kind)}
                          className="mt-3 text-sm font-semibold text-[var(--brand-red)] transition-colors hover:text-[#b91d1d]"
                        >
                          Voir les {group.results.length} résultats
                        </button>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
