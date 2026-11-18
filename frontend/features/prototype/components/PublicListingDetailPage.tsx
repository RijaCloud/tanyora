"use client";

import Image from "next/image";
import { AppImage } from "@/components/ui/AppImage";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ShareArrowIcon } from "@/components/ui/ShareArrowIcon";
import { ShareSheetModal } from "@/components/ui/ShareSheetModal";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import ClassifiedRelatedCard from "@/features/prototype/components/ClassifiedRelatedCard";
import ListingFadeGallery from "@/features/prototype/components/ListingFadeGallery";
import ListingConditionBadge from "@/features/prototype/components/ListingConditionBadge";
import ListingOwnerPlanBadge, { type ListingOwnerPlanId } from "@/features/prototype/components/ListingOwnerPlanBadge";
import RatingStars from "@/features/prototype/components/RatingStars";
import SponsoredSlider from "@/features/prototype/components/SponsoredSlider";
import { extractPlainTextFromListingHtml, sanitizeListingHtml } from "@/lib/content/listing-html";
import { formatRelativeTime } from "@/lib/dates/formatRelativeTime";
import { buildListingSlug } from "@/lib/listings/slug";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";
import { trackContactInitiated, trackContentView } from "@/lib/analytics/ga4";

type BaseItem = {
  id: number;
  title: string;
  description: string;
  location: string;
  date?: string;
  contact: string;
  email: string;
  category: string;
  featured?: boolean;
  profilePhoto?: string;
  ownerWpUserId?: number;
  ownerPlanId?: ListingOwnerPlanId;
  ownerRatingAverage?: number;
  ownerRatingCount?: number;
};

type JobItem = BaseItem & {
  company: string;
  companyLetter: string;
  companyColor: string;
  type: string;
  skills?: string[];
  experienceYears?: string;
  needBy?: string;
  deadline?: string;
  slug?: string;
};

type TenderItem = BaseItem & {
  organization: string;
  organizationLetter: string;
  organizationColor: string;
  type: string;
  budget: string;
  currency?: string;
  deadline: string;
  detailsPdfUrl?: string;
  detailsPdfName?: string;
  slug?: string;
};

type AdItem = BaseItem & {
  seller: string;
  sellerLetter: string;
  sellerColor: string;
  image: string;
  images?: string[];
  price: string;
  currency?: string;
  type?: string;
  condition?: string;
  city?: string;
  area?: string;
  slug?: string;
};

type DetailMode = "job" | "tender" | "ad";

type PublicListingDetailPageProps = {
  backHref: string;
  backLabel: string;
  mode: DetailMode;
  item: JobItem | TenderItem | AdItem;
  bottomSimilarItems?: Array<JobItem | TenderItem | AdItem>;
  isOwner?: boolean;
  ownerEditHref?: string;
  sellerListingsHref?: string;
  modal?: boolean;
  onClose?: () => void;
  renderBottomSimilarItem?: (item: JobItem | TenderItem | AdItem) => ReactNode;
};

function getSimilarSectionCopy(mode: DetailMode) {
  if (mode === "job") {
    return "D'autres offres proches pour comparer rapidement les opportunités.";
  }
  if (mode === "tender") {
    return "D'autres appels proches pour comparer les besoins et les échéances.";
  }
  return "Des annonces proches de la même catégorie pour continuer votre recherche rapidement.";
}

function getBottomSimilarTitle(mode: DetailMode) {
  if (mode === "job") {
    return "Offres de la même catégorie";
  }
  if (mode === "tender") {
    return "Appels d'offres de la même catégorie";
  }
  return "Annonces de la même catégorie";
}

function getBottomSimilarCopy(mode: DetailMode) {
  if (mode === "job") {
    return "Explorez d'autres opportunités proches du même secteur.";
  }
  if (mode === "tender") {
    return "Retrouvez d'autres appels proches pour comparer les besoins.";
  }
  return "Continuez votre recherche avec des annonces proches.";
}

function getSellerListingsLabel(mode: DetailMode) {
  if (mode === "job") {
    return "Voir les autres offres de cet annonceur";
  }
  if (mode === "tender") {
    return "Voir les autres appels d'offres de cet annonceur";
  }
  return "Voir les autres annonces de cet annonceur";
}

function getOwnerEditLabel(mode: DetailMode) {
  if (mode === "job") {
    return "Modifier l'offre d'emploi";
  }
  if (mode === "tender") {
    return "Modifier l'appel d'offres";
  }
  return "Modifier l'annonce";
}

function getJobStatus(deadline?: string) {
  if (!deadline) {
    return "open";
  }

  const normalizedDeadline = new Date(deadline).getTime();
  if (Number.isNaN(normalizedDeadline)) {
    return "open";
  }

  return normalizedDeadline < Date.now() ? "closed" : "open";
}

function getJobStatusLabel(deadline?: string) {
  return getJobStatus(deadline) === "closed" ? "Fermé" : "Ouvert";
}

function formatDetailDate(value?: string) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }

  const parsed = Date.parse(rawValue);
  if (!Number.isNaN(parsed)) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(parsed));
  }

  const match = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  return rawValue;
}

function getItemHref(mode: DetailMode, item: JobItem | TenderItem | AdItem) {
  if (mode === "job") {
    return `/offres-emploi/${"slug" in item && item.slug ? item.slug : buildListingSlug(item.id, item.title, "offre")}`;
  }
  if (mode === "tender") {
    return `/appels-offres/${"slug" in item && item.slug ? item.slug : buildListingSlug(item.id, item.title, "appel-offres")}`;
  }
  return `/petites-annonces/${"slug" in item && item.slug ? item.slug : buildListingSlug(item.id, item.title, "annonce")}`;
}

function BusinessTenderAccessCard({ isLoggedIn, onLoginClick }: { isLoggedIn: boolean; onLoginClick: () => void }) {
  return (
    <div className="ui-card-flat rounded-[20px] border border-[#27624f]/20 bg-[#fff5f6] p-5 dark:bg-[#2a1719]">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#27624f]">Accès Business</p>
      <h3 className="ui-text-main mt-3 text-[22px] font-bold leading-[1.15]">Consultez le dossier complet de cet appel d'offres</h3>
      <p className="ui-text-muted mt-3 text-[14px] leading-[1.7]">
        Les détails, le TDR, les coordonnées et la réponse à cet appel d'offres sont réservés aux comptes Business.
      </p>
      {isLoggedIn ? (
        <a
          href="/tarifs"
          className="mt-5 inline-flex w-full items-center justify-center rounded-[12px] bg-[var(--color-purple)] px-4 py-3 text-[14px] font-semibold text-[var(--color-dark)] transition hover:brightness-95"
        >
          Passer à Business
        </a>
      ) : (
        <button
          type="button"
          onClick={onLoginClick}
          className="mt-5 inline-flex w-full items-center justify-center rounded-[12px] bg-[var(--color-purple)] px-4 py-3 text-[14px] font-semibold text-[var(--color-dark)] transition hover:brightness-95"
        >
          Se connecter
        </button>
      )}
    </div>
  );
}

function SimilarPreviewItem({
  mode,
  item,
}: {
  mode: DetailMode;
  item: JobItem | TenderItem | AdItem;
}) {
  const href = getItemHref(mode, item);

  const subtitle =
    mode === "job"
      ? (item as JobItem).type
      : mode === "tender"
        ? formatListingMoney((item as TenderItem).budget, (item as TenderItem).currency) || (item as TenderItem).budget
        : formatListingMoney((item as AdItem).price, (item as AdItem).currency);
  const shouldShowVisual = mode === "ad" && "image" in item;

  return (
    <a
      href={href}
      className="group flex w-[min(280px,82vw)] items-center gap-3 rounded-[18px] ui-card-flat p-3 text-left transition-colors duration-300 hover:border-[#27624f]/30 sm:w-[260px]"
    >
      {shouldShowVisual ? (
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[14px]">
          <Image alt={item.title} src={(item as AdItem).image} fill className="object-cover" sizes="72px" />
        </div>
      ) : (
        <div
          className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[14px] text-[24px] font-bold text-white"
          style={{
            backgroundColor:
              "companyColor" in item
                ? item.companyColor
                : "organizationColor" in item
                  ? item.organizationColor
                  : (item as AdItem).sellerColor,
          }}
        >
          {"companyLetter" in item ? item.companyLetter : "organizationLetter" in item ? item.organizationLetter : (item as AdItem).sellerLetter}
        </div>
      )}
      <div className="min-w-0">
        <div className="mb-1 ui-surface-soft ui-text-muted inline-flex rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em]">
          similaire
        </div>
        <p className="ui-text-main line-clamp-2 text-[13px] font-semibold leading-[1.3]">{item.title}</p>
        <p className="ui-text-muted mt-1 text-[11px]">{subtitle}</p>
      </div>
    </a>
  );
}

function BottomSimilarCard({
  mode,
  item,
}: {
  mode: DetailMode;
  item: JobItem | TenderItem | AdItem;
}) {
  const href = getItemHref(mode, item);
  const description = extractPlainTextFromListingHtml(item.description || "");

  if (mode === "ad") {
    const ad = item as AdItem;
    return <ClassifiedRelatedCard href={href} item={ad} />;
  }

  const letter = mode === "job" ? (item as JobItem).companyLetter : (item as TenderItem).organizationLetter;
  const color = mode === "job" ? (item as JobItem).companyColor : (item as TenderItem).organizationColor;
  const ownerName = mode === "job" ? (item as JobItem).company : (item as TenderItem).organization;
  const visibleSkills = mode === "job" ? ((item as JobItem).skills || []).slice(0, 2) : [];
  const statusLabel = mode === "job" ? getJobStatusLabel((item as JobItem).deadline) : "";
  const isClosed = mode === "job" ? getJobStatus((item as JobItem).deadline) === "closed" : false;
  const tenderBudget =
    mode === "tender"
      ? formatListingMoney((item as TenderItem).budget, (item as TenderItem).currency) || (item as TenderItem).budget
      : "";

  return (
    <a
      href={href}
      className="group ui-surface relative block h-[240px] w-[min(280px,82vw)] shrink-0 overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card sm:w-[180px]"
    >
      <div aria-hidden="true" className="ui-border absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      <div className="flex h-full flex-col p-[5px]">
        <div className="flex h-full flex-col gap-[8px] px-[14px] py-[12px]">
        <div className="content-stretch relative flex w-full items-start gap-[12px]">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-white" style={{ backgroundColor: color }}>
            {letter}
          </div>
          <div className="content-stretch relative flex min-h-px min-w-px flex-[1_0_0] flex-col items-start gap-[4px] pr-[6px]">
            <div className="ui-text-main flex flex-col justify-center font-['Roboto_Flex:Bold',sans-serif] text-[14px] font-bold">
              <p className={mode === "job" ? "line-clamp-2 break-normal leading-[1.2] [text-wrap:balance]" : "line-clamp-1 leading-[1.2]"}>
                {ownerName}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-[12px] relative shrink-0 w-[13px]">
                <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]">
                  <svg className="h-[13px] w-[8px] text-[#27624f]" viewBox="0 0 8 13" fill="none" aria-hidden="true">
                    <path d="M4 12.25C6.25 9.25 7.375 6.875 7.375 5.125C7.375 2.64072 5.35928 0.625 2.875 0.625C0.390719 0.625 -1.625 2.64072 -1.625 5.125C-1.625 6.875 -0.5 9.25 1.75 12.25C2.875 13.625 2.875 13.625 4 12.25Z" fill="currentColor" transform="translate(1.625 0)" />
                  </svg>
                </div>
              </div>
              <span className="ui-text-soft line-clamp-1 min-w-0 break-normal font-['Roboto_Flex:Regular',sans-serif] text-[11px]">
                {item.location}
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-[4px]">
          <div className="min-w-0">
            <div className="ui-text-main flex min-h-[34px] flex-col font-['Roboto_Flex:SemiBold',sans-serif] text-[14px] font-semibold">
              <p className="overflow-hidden leading-[1.25] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [text-overflow:clip]">{item.title}</p>
            </div>
          </div>
          {mode === "job" ? (
            <>
              <div className="flex justify-start">
                <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${isClosed ? "bg-[#fff1f2] text-[#27624f]" : "bg-[#ecfdf3] text-[#15803d]"}`}>
                  {statusLabel}
                </span>
              </div>
              {visibleSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {visibleSkills.map((skill) => (
                    <span key={`${item.id}-${skill}`} className="ui-surface-soft ui-text-muted rounded-full px-2 py-1 text-[9px] font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="ui-text-muted flex flex-col gap-0.5 text-[10px] leading-[1.25]">
                {(item as JobItem).deadline ? <span>Date d'application : {(item as JobItem).deadline}</span> : null}
                {item.date ? <span>{formatRelativeTime(item.date)}</span> : null}
              </div>
            </>
          ) : (
            <>
              {tenderBudget ? (
                <p className="text-[13px] font-bold leading-[1.2] text-[#e11d2e]">{tenderBudget}</p>
              ) : null}
              <div className="ui-text-muted flex flex-col gap-0.5 text-[10px] leading-[1.25]">
                {(item as TenderItem).deadline ? <span>Date limite : {(item as TenderItem).deadline}</span> : null}
                {item.date ? <span>{formatRelativeTime(item.date)}</span> : null}
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </a>
  );
}

export default function PublicListingDetailPage({
  backHref,
  backLabel,
  mode,
  item,
  bottomSimilarItems = [],
  isOwner = false,
  ownerEditHref = "/profil/petites-annonces",
  sellerListingsHref = "/petites-annonces",
  modal = false,
  onClose,
  renderBottomSimilarItem,
}: PublicListingDetailPageProps) {
  const { isLoggedIn, user, userPlan, setShowLoginModal } = useAuth();
  const entityName =
    mode === "job"
      ? (item as JobItem).company
      : mode === "tender"
        ? (item as TenderItem).organization
        : (item as AdItem).seller;

  const entityLetter =
    mode === "job"
      ? (item as JobItem).companyLetter
      : mode === "tender"
        ? (item as TenderItem).organizationLetter
        : (item as AdItem).sellerLetter;

  const entityColor =
    mode === "job"
      ? (item as JobItem).companyColor
      : mode === "tender"
        ? (item as TenderItem).organizationColor
        : (item as AdItem).sellerColor;
  const entityProfilePhoto = item.profilePhoto || "";
  const tenderBudgetLabel =
    mode === "tender"
      ? formatListingMoney((item as TenderItem).budget, (item as TenderItem).currency) || (item as TenderItem).budget || ""
      : "";
  const tenderDeadlineLabel = mode === "tender" ? formatDetailDate((item as TenderItem).deadline) : "";

  const primaryMeta =
    mode === "job"
      ? (item as JobItem).type
      : mode === "tender"
        ? tenderBudgetLabel
        : formatListingMoney((item as AdItem).price, (item as AdItem).currency);
  const adContactHref =
    mode === "ad"
      ? `/petites-annonces/${"slug" in item && item.slug ? item.slug : buildListingSlug(item.id, item.title, "annonce")}/contacter`
      : null;
  const conversationContactHref =
    mode === "job"
      ? `/offres-emploi/${"slug" in item && item.slug ? item.slug : buildListingSlug(item.id, item.title, "offre")}/contacter`
      : mode === "tender"
        ? `/appels-offres/${"slug" in item && item.slug ? item.slug : buildListingSlug(item.id, item.title, "appel-offres")}/contacter`
        : adContactHref;
  const directContactHref =
    mode === "ad" || mode === "job" || mode === "tender"
      ? conversationContactHref
      : item.email
        ? `mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(`Tanyora - ${item.title}`)}`
        : item.contact
          ? `tel:${item.contact.replace(/\s+/g, "")}`
          : null;
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const [isEmailVisible, setIsEmailVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveReady, setSaveReady] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHtmlReady, setIsHtmlReady] = useState(false);
  const [liveSellerRatingAverage, setLiveSellerRatingAverage] = useState(Number(item.ownerRatingAverage || 0));
  const [liveSellerRatingCount, setLiveSellerRatingCount] = useState(Number(item.ownerRatingCount || 0));
  const [ownerPlanId, setOwnerPlanId] = useState<ListingOwnerPlanId | undefined>(item.ownerPlanId);

  useEffect(() => {
    const ownerId = Number(item.ownerWpUserId || 0);
    let cancelled = false;

    setOwnerPlanId(item.ownerPlanId);
    if (item.ownerPlanId || ownerId <= 0) {
      return () => {
        cancelled = true;
      };
    }

    void fetch(`/api/public/listing-owner-plans?ids=${encodeURIComponent(String(ownerId))}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(payload?.items)) {
          return undefined;
        }
        const planId = payload.items.find((entry: { wpUserId?: number; planId?: unknown }) => Number(entry?.wpUserId) === ownerId)?.planId;
        return planId === "essentiel" || planId === "business" ? planId : undefined;
      })
      .then((planId) => {
        if (!cancelled) {
          setOwnerPlanId(planId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOwnerPlanId(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [item.ownerPlanId, item.ownerWpUserId]);
  const publishedDateValue = useMemo(() => {
    const rawValue = item.date || ("deadline" in item ? (item.deadline || "") : "");
    if (!rawValue) {
      return "";
    }

    const timestamp = new Date(rawValue).getTime();
    if (!Number.isFinite(timestamp)) {
      return rawValue;
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(timestamp));
  }, [item]);

  const savedKind = useMemo(() => {
    if (mode === "job") return "job";
    if (mode === "tender") return "tender";
    return "classified";
  }, [mode]);
  const canSaveItem = !isOwner;
  const isEmailVerificationRequired = isLoggedIn && user?.emailVerified === false;
  const canAccessTenderDetails = mode !== "tender" || userPlan === "business";
  const hasPaidContactAccess = mode === "tender" ? canAccessTenderDetails : isOwner || userPlan === "essentiel" || userPlan === "business";
  const shouldHideContactActions = !hasPaidContactAccess;

  useEffect(() => {
    trackContentView(mode === "ad" ? "classified" : mode);
  }, [mode]);

  function trackContact(channel: "email" | "message" | "phone") {
    trackContactInitiated(mode === "ad" ? "classified" : mode, channel);
  }

  const savedPayload = useMemo(
    () => ({
      kind: savedKind,
      itemId: String(item.id),
      slug: "slug" in item ? item.slug : undefined,
      title: item.title,
      description: item.description,
      image: "image" in item ? item.image : undefined,
      location: item.location,
      price: "price" in item ? item.price : "budget" in item ? item.budget : undefined,
      sourceLabel: entityName,
    }),
    [entityName, item, savedKind],
  );

  const adItem = mode === "ad" ? (item as AdItem) : null;
  const shouldShowVisualGallery = mode === "ad";

  const galleryImages = useMemo(() => {
    if (!adItem) {
      return [];
    }

    return Array.from(new Set([...(adItem.images || []), adItem.image].filter(Boolean)));
  }, [adItem]);
  const detailContent = useMemo(() => {
    if (!isHtmlReady) {
      return "";
    }
    return sanitizeListingHtml(item.description || "");
  }, [isHtmlReady, item.description]);
  const detailTextContent = useMemo(() => extractPlainTextFromListingHtml(item.description || ""), [item.description]);
  const bottomSimilarTitle = useMemo(() => getBottomSimilarTitle(mode), [mode]);
  const bottomSimilarCopy = useMemo(() => getBottomSimilarCopy(mode), [mode]);
  const sellerListingsLabel = useMemo(() => getSellerListingsLabel(mode), [mode]);
  const ownerEditLabel = useMemo(() => getOwnerEditLabel(mode), [mode]);
  const contactActionLabel = mode === "job" ? "Postuler" : "Contacter";
  const showBottomSimilar = bottomSimilarItems.length > 0;
  const sellerRatingAverage = liveSellerRatingAverage;
  const sellerRatingCount = liveSellerRatingCount;

  useEffect(() => {
    setLiveSellerRatingAverage(Number(item.ownerRatingAverage || 0));
    setLiveSellerRatingCount(Number(item.ownerRatingCount || 0));
  }, [item.id, item.ownerRatingAverage, item.ownerRatingCount]);

  useEffect(() => {
    setIsHtmlReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (savedKind !== "classified" && savedKind !== "job" && savedKind !== "tender") {
      return;
    }

    const sessionKey = `2424-listing-view:${savedKind}:${item.id}`;
    if (window.sessionStorage.getItem(sessionKey) === "1") {
      return;
    }

    let cancelled = false;

    const registerView = async () => {
      try {
        const response = await fetch("/api/public/listings/view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: savedKind,
            id: item.id,
          }),
        });

        if (!cancelled && response.ok) {
          window.sessionStorage.setItem(sessionKey, "1");
        }
      } catch {
        // Best-effort tracking only.
      }
    };

    void registerView();

    return () => {
      cancelled = true;
    };
  }, [item.id, savedKind]);

  useEffect(() => {
    let cancelled = false;

    async function loadRatingEligibility() {
      try {
        const response = await fetch(`/api/ratings/${savedKind}?listingId=${encodeURIComponent(String(item.id))}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || cancelled) {
          return;
        }

        if (Number.isFinite(Number(payload?.ownerRatingAverage))) {
          setLiveSellerRatingAverage(Number(payload?.ownerRatingAverage || 0));
        }
        if (Number.isFinite(Number(payload?.ownerRatingCount))) {
          setLiveSellerRatingCount(Number(payload?.ownerRatingCount || 0));
        }
      } catch {}
    }

    void loadRatingEligibility();
    return () => {
      cancelled = true;
    };
  }, [item.id, savedKind]);

  useEffect(() => {
    let cancelled = false;
    const fetchSavedState = async () => {
      try {
        const response = await fetch(`/api/saved-items?kind=${savedKind}&itemId=${item.id}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        if (response.ok) {
          setIsSaved(Boolean(payload?.saved));
        } else if (response.status === 401) {
          setIsSaved(false);
        }
      } catch {
        if (!cancelled) {
          setIsSaved(false);
        }
      } finally {
        if (!cancelled) {
          setSaveReady(true);
        }
      }
    };
    void fetchSavedState();
    return () => {
      cancelled = true;
    };
  }, [item.id, savedKind]);

  async function handleToggleSave() {
    if (isSaving || !saveReady || !canSaveItem || isEmailVerificationRequired) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/saved-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggle",
          item: savedPayload,
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

  const shareHref =
    mode === "ad"
      ? `/petites-annonces/${"slug" in item && item.slug ? item.slug : buildListingSlug(item.id, item.title, "annonce")}`
      : mode === "job"
        ? `/offres-emploi/${"slug" in item && item.slug ? item.slug : buildListingSlug(item.id, item.title, "offre")}`
        : `/appels-offres/${"slug" in item && item.slug ? item.slug : buildListingSlug(item.id, item.title, "appel-offres")}`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${shareHref}` : shareHref;

  const content = (
    <div className={`public-listing-detail-page ${modal ? "" : "ui-page min-h-screen pb-16 pt-8"} font-['Roboto_Flex',sans-serif]`}>
      <div
        className={`mx-auto flex w-full flex-col ${modal ? "max-w-none gap-0 px-0" : "max-w-[1120px] gap-5 px-4 sm:px-6 lg:px-8"}`}
      >
        {!modal ? (
          <div>
            <a
              href={backHref}
              className="ui-surface ui-text-main ui-border inline-flex items-center rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] transition hover:border-[#27624f] hover:text-[#27624f]"
            >
              {backLabel}
            </a>
          </div>
        ) : null}

        <div className="ui-surface rounded-[24px] p-5 sm:p-6">
          <div className="flex flex-col gap-5">
              {isEmailVerificationRequired ? (
                <div className="rounded-[12px] border border-[#f7cfd3] bg-[#fff2f3] px-4 py-2 text-[12px] text-[#8c1d24] dark:border-[#5a2a2d] dark:bg-[#311d20] dark:text-[#ffb7bd]">
                  Vérification email requise pour enregistrer, partager ou contacter un annonceur.
                </div>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0">
                  {shouldShowVisualGallery ? (
                    <div className="mb-5">
                      <ListingFadeGallery
                        title={item.title}
                        meta={primaryMeta}
                        location={item.location}
                        images={galleryImages}
                        conditionLabel={"condition" in item ? item.condition || "" : ""}
                      />
                    </div>
                  ) : null}
                  {canAccessTenderDetails ? (
                    <div className="ui-card-flat rounded-[20px] p-5">
                      {!shouldShowVisualGallery ? (
                        <div className="mb-5 rounded-[24px] border ui-border ui-surface-soft p-5 sm:p-6">
                          <h1 className="ui-text-main text-[28px] font-semibold leading-[1.08] sm:text-[36px]">
                            {item.title}
                          </h1>
                          <div className="ui-text-muted mt-4 flex flex-wrap items-center gap-3 text-[14px]">
                            <span className="ui-surface ui-text-main inline-flex rounded-full px-3 py-1.5 font-medium">
                              {item.category}
                            </span>
                            {"condition" in item && item.condition ? (
                              <ListingConditionBadge className="text-[13px]">
                                {item.condition}
                              </ListingConditionBadge>
                            ) : null}
                            {primaryMeta ? <span>{primaryMeta}</span> : null}
                            {item.location ? <span>{item.location}</span> : null}
                          </div>
                        </div>
                      ) : null}
                      <div className="ui-text-main space-y-4 break-words text-[15px] leading-[1.7] [overflow-wrap:anywhere]">
                        {detailContent ? (
                          <div
                            className="prose prose-p:my-3 prose-ul:my-3 prose-li:my-1 max-w-none text-[15px] leading-[1.7] text-[color:var(--text-main)] dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: detailContent }}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap">{detailTextContent || item.description}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <BusinessTenderAccessCard isLoggedIn={isLoggedIn} onLoginClick={() => setShowLoginModal(true)} />
                  )}
                </div>

                <div className={`flex flex-col gap-3 ${modal ? "pt-10" : ""}`}>
                  {canAccessTenderDetails ? (
                  <>
                    <div className="flex justify-end gap-2">
                      {!isOwner ? (
                        <button
                          aria-label={isSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
                          aria-pressed={isSaved}
                          title={isSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
                          onClick={() => {
                            void handleToggleSave();
                          }}
                          disabled={isSaving || !saveReady || !canSaveItem || isEmailVerificationRequired}
                          className={`listing-detail-icon-action flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:border-[#27624f] hover:text-[#27624f] ${
                            isSaved
                              ? "border-[#27624f] bg-[#27624f] text-white shadow-[0_10px_24px_rgba(204,32,42,0.22)]"
                              : "ui-surface ui-border ui-text-main"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <svg className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21.435 6.582a5.54 5.54 0 00-7.84 0L12 8.177l-1.595-1.595a5.54 5.54 0 00-7.84 7.84l1.595 1.595L12 21.857l7.84-5.84 1.595-1.595a5.54 5.54 0 000-7.84z"
                            />
                          </svg>
                        </button>
                      ) : null}
                        <button
                          aria-label="Partager"
                          title="Partager"
                        onClick={() => {
                          setIsShareModalOpen(true);
                        }}
                        disabled={isEmailVerificationRequired}
                          className="listing-detail-icon-action ui-surface ui-border ui-text-main flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ShareArrowIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="ui-card-flat rounded-[18px] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#27624f]">Annonceur</p>
                      <div className="mt-4">
                        <div className="flex items-center gap-3">
                          {entityProfilePhoto ? (
                            <div className="relative isolate h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full [clip-path:circle(50%)] ui-surface-soft">
                              <AppImage alt={entityName} className="absolute inset-0 block h-full w-full rounded-full object-cover" src={entityProfilePhoto} eager />
                            </div>
                          ) : (
                            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full text-[18px] font-bold text-white" style={{ backgroundColor: entityColor }}>
                              {entityLetter}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <p className="ui-text-main truncate text-[16px] font-semibold">{entityName}</p>
                              <ListingOwnerPlanBadge planId={ownerPlanId} />
                            </div>
                            {sellerRatingCount > 0 ? (
                              <div className="ui-text-muted mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                                <RatingStars value={sellerRatingAverage} size={14} />
                                <span>
                                  {sellerRatingAverage.toFixed(1)}/5 • {sellerRatingCount} avis
                                </span>
                              </div>
                            ) : (
                              <p className="ui-text-muted mt-1 text-[12px]">Aucune note pour le moment</p>
                            )}
                            {item.location ? <p className="ui-text-muted mt-1 text-[12px]">{item.location}</p> : null}
                          </div>
                        </div>
                        {!isOwner ? (
                          <a
                            href={sellerListingsHref}
                            className="ui-surface ui-text-main ui-border mt-4 inline-flex w-full items-center justify-center rounded-[12px] border px-4 py-3 text-[13px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                          >
                            {sellerListingsLabel}
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="ui-card-flat rounded-[20px] p-5">
                      <div className="space-y-5">
                        {mode === "job" ? (
                          <>
                            <DetailBlock
                              label="Statut"
                              value={Date.parse(String((item as JobItem).deadline || "").trim()) < Date.now() ? "Fermé" : "Ouvert"}
                            />
                            {(item as JobItem).skills && (item as JobItem).skills?.length ? (
                              <DetailBlock label="Compétences" value={((item as JobItem).skills || []).join(", ")} />
                            ) : null}
                            {(item as JobItem).experienceYears ? (
                              <DetailBlock label="Expérience" value={(item as JobItem).experienceYears || ""} />
                            ) : null}
                            {(item as JobItem).deadline && (
                              <DetailBlock label="Candidatures acceptées jusqu'au" value={(item as JobItem).deadline || ""} />
                            )}
                          </>
                        ) : mode === "tender" ? (
                          <>
                            <DetailBlock label="Type de projet" value={(item as TenderItem).type} />
                            {tenderBudgetLabel ? <DetailBlock label="Budget" value={tenderBudgetLabel} /> : null}
                            {tenderDeadlineLabel ? <DetailBlock label="Date limite" value={tenderDeadlineLabel} /> : null}
                            {(item as TenderItem).detailsPdfUrl ? (
                              <div>
                                <p className="ui-text-main text-[12px] font-bold">TDR</p>
                                <a
                                  href={(item as TenderItem).detailsPdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ui-surface ui-text-main ui-border mt-2 inline-flex items-center justify-center rounded-[10px] border px-3 py-1.5 text-[12px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                                >
                                  Télécharger TDR
                                </a>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <DetailBlock label="Prix" value={formatListingMoney((item as AdItem).price, (item as AdItem).currency)} />
                            {(item as AdItem).condition ? <DetailBlock label="Condition" value={(item as AdItem).condition || ""} /> : null}
                          </>
                        )}

                        <DetailBlock label="Catégorie" value={item.category} />
                        <DetailBlock label="Lieu" value={item.location} />
                        <DetailBlock label="Date de publication" value={publishedDateValue} />
                        {mode !== "job" ? (
                          <>
                            <div>
                              <p className="ui-text-main text-[12px] font-bold">Contact</p>
                              <p className="ui-text-muted mt-1 break-words text-[14px] leading-[1.6] [overflow-wrap:anywhere]">
                                {shouldHideContactActions ? "Réservé aux abonnés Essentiel et Business" : isPhoneVisible ? item.contact || "-" : "Masqué"}
                              </p>
                              {!shouldHideContactActions ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isPhoneVisible) trackContact("phone");
                                    setIsPhoneVisible((current) => !current);
                                  }}
                                  className="ui-surface ui-text-main ui-border mt-2 inline-flex items-center justify-center rounded-[10px] border px-3 py-1.5 text-[12px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                                >
                                  {isPhoneVisible ? "Masquer le contact" : "Voir le contact"}
                                </button>
                              ) : null}
                            </div>
                            <div>
                              <p className="ui-text-main text-[12px] font-bold">Mail</p>
                              <p className="ui-text-muted mt-1 break-words text-[14px] leading-[1.6] [overflow-wrap:anywhere]">
                                {shouldHideContactActions ? "Réservé aux abonnés Essentiel et Business" : isEmailVisible ? item.email || "-" : "Masqué"}
                              </p>
                              {!shouldHideContactActions ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isEmailVisible) trackContact("email");
                                    setIsEmailVisible((current) => !current);
                                  }}
                                  className="ui-surface ui-text-main ui-border mt-2 inline-flex items-center justify-center rounded-[10px] border px-3 py-1.5 text-[12px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                                >
                                  {isEmailVisible ? "Masquer le contact" : "Voir le contact"}
                                </button>
                              ) : null}
                            </div>
                          </>
                        ) : null}
                      </div>

                      {isOwner ? (
                        <a
                          href={ownerEditHref}
                          className="ui-surface ui-text-main ui-border mt-6 inline-flex w-full items-center justify-center rounded-[12px] border px-4 py-3 text-[14px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                        >
                          {ownerEditLabel}
                        </a>
                      ) : mode === "ad" ? (
                        shouldHideContactActions ? (
                          isLoggedIn ? (
                            <a
                              href="/tarifs"
                              className="mt-6 inline-flex w-full items-center justify-center rounded-[12px] bg-[var(--color-purple)] px-4 py-3 text-[14px] font-semibold text-[var(--color-dark)] transition hover:brightness-95"
                            >
                              Passer à Essentiel
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowLoginModal(true)}
                              className="mt-6 inline-flex w-full items-center justify-center rounded-[12px] bg-[var(--color-purple)] px-4 py-3 text-[14px] font-semibold text-[var(--color-dark)] transition hover:brightness-95"
                            >
                              Se connecter
                            </button>
                          )
                        ) : (
                          <a
                            href={isEmailVerificationRequired ? "#" : adContactHref || "#"}
                            onClick={(event) => {
                              if (isEmailVerificationRequired) {
                                event.preventDefault();
                                return;
                              }
                              trackContact("message");
                            }}
                            className={`mt-6 inline-flex w-full items-center justify-center rounded-[12px] px-4 py-3 text-[14px] font-semibold text-white transition ${
                              isEmailVerificationRequired
                                ? "cursor-not-allowed bg-[#9b9ba1]"
                                : "bg-[#22c55e] hover:bg-[#16a34a]"
                            }`}
                          >
                            {isEmailVerificationRequired ? "Vérification email requise" : contactActionLabel}
                          </a>
                        )
                      ) : shouldHideContactActions ? (
                        isLoggedIn ? (
                          <a
                            href="/tarifs"
                            className="mt-6 inline-flex w-full items-center justify-center rounded-[12px] bg-[var(--color-purple)] px-4 py-3 text-[14px] font-semibold text-[var(--color-dark)] transition hover:brightness-95"
                          >
                            Passer à Essentiel
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowLoginModal(true)}
                            className="mt-6 w-full rounded-[12px] bg-[var(--color-purple)] px-4 py-3 text-[14px] font-semibold text-[var(--color-dark)] transition hover:brightness-95"
                          >
                            Se connecter
                          </button>
                        )
                      ) : directContactHref ? (
                        <a
                          href={isEmailVerificationRequired ? "#" : directContactHref}
                          onClick={(event) => {
                            if (isEmailVerificationRequired) {
                              event.preventDefault();
                              return;
                            }
                            trackContact(directContactHref.startsWith("mailto:") ? "email" : "phone");
                          }}
                          className={`mt-6 inline-flex w-full items-center justify-center rounded-[12px] px-4 py-3 text-[14px] font-semibold text-white transition ${
                            isEmailVerificationRequired
                              ? "cursor-not-allowed bg-[#9b9ba1]"
                              : "bg-[#22c55e] hover:bg-[#16a34a]"
                          }`}
                        >
                          {isEmailVerificationRequired ? "Vérification email requise" : contactActionLabel}
                        </a>
                      ) : (
                        <div className="ui-surface-soft ui-border ui-text-muted mt-6 rounded-[12px] border border-dashed px-4 py-3 text-center text-[13px]">
                          Aucune information de contact disponible pour le moment.
                        </div>
                      )}
                    </div>
                  </>
                  ) : (
                    <BusinessTenderAccessCard isLoggedIn={isLoggedIn} onLoginClick={() => setShowLoginModal(true)} />
                  )}
                </div>
              </div>
              {showBottomSimilar ? (
                <div className={`${modal ? "mt-1 border-t border-[#ececec] pt-5 dark:border-[#3a3a3a]" : ""}`}>
                  <div className={modal ? "" : "ui-card-flat rounded-[20px] p-5"}>
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-[#27624f]">À voir aussi</p>
                        <h2 className="ui-text-main mt-2 text-[24px] font-semibold">{bottomSimilarTitle}</h2>
                      </div>
                      <p className="ui-text-muted max-w-[420px] text-[14px] leading-[1.6]">{bottomSimilarCopy}</p>
                    </div>
                    <SponsoredSlider
                      items={bottomSimilarItems.slice(0, 6)}
                      singleStepBreakpoint={1024}
                      renderItem={(similarItem) =>
                        renderBottomSimilarItem ? renderBottomSimilarItem(similarItem) : <BottomSimilarCard mode={mode} item={similarItem} />
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
        </div>
      </div>
      <ShareSheetModal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={item.title}
        url={shareUrl}
        text={item.title}
      />
    </div>
  );

  if (!modal) {
    return content;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-[rgba(10,10,12,0.62)] px-4 py-4 sm:px-6 lg:px-8"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fermer l'aperçu"
        className="absolute inset-0 cursor-default"
        onClick={() => onClose?.()}
      />
      <div className="relative z-[1] my-auto w-full max-w-[1120px] rounded-[20px]">
        <button
          type="button"
          aria-label="Fermer l'aperçu"
          onClick={() => onClose?.()}
          className="listing-detail-close"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {content}
      </div>
    </div>,
    document.body,
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="ui-text-main text-[12px] font-bold">{label}</p>
      <p className="ui-text-muted mt-1 break-words text-[14px] leading-[1.6] [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}






