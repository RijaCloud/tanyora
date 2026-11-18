// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { AppImage } from "@/components/ui/AppImage";
import clsx from "clsx";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import ListingFadeGallery from "@/features/prototype/components/ListingFadeGallery";
import { ClassifiedGridCard } from "@/features/prototype/components/ClassifiedGridCard";
import PublicListingDetailPage from "@/features/prototype/components/PublicListingDetailPage";
import PublicListPagination from "@/features/prototype/components/PublicListPagination";
import PublicListQuickCreateButton from "@/features/prototype/components/PublicListQuickCreateButton";
import PublicAdBannerRow from "@/features/prototype/components/PublicAdBannerRow";
import InlinePublicListingAdCard from "@/features/prototype/components/InlinePublicListingAdCard";
import ListingConditionBadge from "@/features/prototype/components/ListingConditionBadge";
import ListingOwnerPlanBadge, { type ListingOwnerPlanId } from "@/features/prototype/components/ListingOwnerPlanBadge";
import ListingSkillRow from "@/features/prototype/components/ListingSkillRow";
import ClassifiedRelatedCard from "@/features/prototype/components/ClassifiedRelatedCard";
import SponsoredSlider from "@/features/prototype/components/SponsoredSlider";
import PublicListingCategoryFilter from "@/features/prototype/components/PublicListingCategoryFilter";
import PublicListingLocationFilter from "@/features/prototype/components/PublicListingLocationFilter";
import PublicListingTextFilter from "@/features/prototype/components/PublicListingTextFilter";
import PublicListingCollection, { PublicListingViewToggle, type PublicListingViewMode } from "@/features/prototype/components/PublicListingCollection";
import { ShareArrowIcon } from "@/components/ui/ShareArrowIcon";
import { ShareSheetModal } from "@/components/ui/ShareSheetModal";
import svgPaths from "@/features/prototype/imports/svg-efimawrs95";
import { extractPlainTextFromListingHtml, sanitizeListingHtml } from "@/lib/content/listing-html";
import { formatRelativeTime } from "@/lib/dates/formatRelativeTime";
import { buildListingSlug, extractListingIdFromSlug } from "@/lib/listings/slug";
import {
  currentPublicListSearchSuffix,
  readPublicListNumberParamFromUrl,
  readPublicListPageFromUrl,
  readPublicListStringParamFromUrl,
  updatePublicListPageUrl,
  updatePublicListQueryParams,
} from "@/lib/listings/public-list-page";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";
import type { PublicAdItem } from "@/lib/api/wordpress-internal";
import { dedupeTaxonomyTermsByHierarchy, type TaxonomyTermResult } from "@/lib/taxonomy/terms";
import { useScrollResultsIntoView } from "@/lib/hooks/useScrollResultsIntoView";
import { usePublicListingFilterCatalog } from "@/lib/hooks/usePublicListingFilterCatalog";
import { injectInlinePublicAds } from "@/lib/listings/inline-public-ads";

// Classified ad data with categories
interface AdData {
  id: number;
  sourceKind: "classified" | "job";
  seller: string;
  sellerLetter: string;
  sellerColor: string;
  companyLogo?: string;
  sellerProfilePhoto?: string;
  location: string;
  title: string;
  description: string;
  excerpt?: string;
  content?: string;
  price: string;
  currency?: string;
  date: string;
  category: string;
  productTag?: string;
  condition?: string;
  type?: string;
  skills?: string[];
  experienceYears?: string;
  needBy?: string;
  deadline?: string;
  featured?: boolean;
  image: string;
  images?: string[];
  contact?: string;
  email?: string;
  isAdminCreated?: boolean;
  city?: string;
  area?: string;
  ownerWpUserId?: number;
  ownerRatingAverage?: number;
  ownerRatingCount?: number;
  ownerPlanId?: PremiumOwnerPlanId;
}

type PremiumOwnerPlanId = ListingOwnerPlanId;

function normalizeJobSkills(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => decodeListingDisplayText(String(entry || "").trim()))
      .filter(Boolean)
      .slice(0, 5);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => decodeListingDisplayText(entry.trim()))
      .filter(Boolean)
      .slice(0, 5);
  }

  return [];
}

function buildJobLocation(city?: string, area?: string, fallback?: string) {
  const safeCity = String(city || "").trim();
  const safeArea = String(area || "").trim();
  if (safeArea && safeCity) {
    return `${safeArea}, ${safeCity}`;
  }
  if (safeCity) {
    return safeCity;
  }
  if (safeArea) {
    return safeArea;
  }
  return String(fallback || "").trim() || "Madagascar";
}

function getJobStatus(deadline?: string) {
  const parsed = Date.parse(String(deadline || "").trim());
  if (!Number.isFinite(parsed)) {
    return "open";
  }

  return parsed < Date.now() ? "closed" : "open";
}

function getJobStatusLabel(deadline?: string) {
  return getJobStatus(deadline) === "closed" ? "Fermé" : "Ouvert";
}

function formatListingMetaDate(value?: string) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const parsed = new Date(raw);
  if (Number.isFinite(parsed.getTime())) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parsed);
  }

  return raw;
}

function decodeListingDisplayText(value: unknown, fallback = "") {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) {
    return fallback;
  }

  const decodedValue = rawValue
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));

  return extractPlainTextFromListingHtml(decodedValue) || decodedValue;
}

function mapClassifiedListingToAd(item: any): AdData {
  const sellerName = decodeListingDisplayText(item.publisherName || item.companyName, "Publié sur Tanyora");
  return {
    id: Number(item.id),
    sourceKind: "classified",
    seller: sellerName,
    sellerLetter: sellerName.slice(0, 1).toUpperCase() || "P",
    sellerColor: "#27624f",
    sellerProfilePhoto: item.profilePhoto || "",
    location: decodeListingDisplayText(item.location, "Madagascar"),
    title: decodeListingDisplayText(item.title, "Annonce"),
    description: extractPlainTextFromListingHtml(item.content || item.description || ""),
    excerpt: extractPlainTextFromListingHtml(item.excerpt || item.description || ""),
    content: item.content || "",
    price: item.price || "",
    currency: item.currency || "MGA",
    date: item.date || "",
    category: decodeListingDisplayText(item.category, "Divers"),
    productTag: decodeListingDisplayText(item.productTag || ""),
    condition: decodeListingDisplayText(item.condition || ""),
    type: decodeListingDisplayText(item.type || ""),
    featured: Boolean(item.featured),
    image: item.image || item.images?.[0] || "/image-placeholder.png",
    images: Array.isArray(item.images) ? item.images : [],
    contact: item.contactPhone || "",
    email: item.contactEmail || "",
    isAdminCreated: Boolean(item.isAdminCreated),
    city: item.city || item.regions?.[0] || "",
    area: item.area || item.cities?.[0] || "",
    ownerWpUserId: Number(item.ownerWpUserId || 0),
    ownerRatingAverage: Number(item.ownerRatingAverage || 0),
    ownerRatingCount: Number(item.ownerRatingCount || 0),
  };
}

function mapJobListingToAd(item: any): AdData {
  const sellerName = decodeListingDisplayText(item.companyName || item.publisherName, "Organisation");
  return {
    id: Number(item.id),
    sourceKind: "job",
    seller: sellerName,
    sellerLetter: sellerName.slice(0, 1).toUpperCase() || "O",
    sellerColor: "#27624f",
    companyLogo: item.companyLogo || "",
    sellerProfilePhoto: item.profilePhoto || "",
    location: decodeListingDisplayText(buildJobLocation(item.city, item.area, item.location), "Madagascar"),
    title: decodeListingDisplayText(item.title, "Offre d'emploi"),
    description: extractPlainTextFromListingHtml(item.content || item.description || ""),
    excerpt: extractPlainTextFromListingHtml(item.excerpt || item.description || ""),
    content: item.content || "",
    price: "",
    currency: "MGA",
    date: item.date || "",
    category: decodeListingDisplayText(item.category, "Emploi"),
    productTag: "",
    type: decodeListingDisplayText(item.type || ""),
    skills: normalizeJobSkills(item.skills),
    experienceYears: item.experienceYears || "",
    needBy: item.needBy || "",
    deadline: item.deadline || "",
    featured: Boolean(item.featured),
    image: item.image || item.images?.[0] || "/image-placeholder.png",
    images: Array.isArray(item.images) ? item.images : [],
    contact: item.contactPhone || "",
    email: item.contactEmail || "",
    isAdminCreated: Boolean(item.isAdminCreated),
    city: item.city || item.regions?.[0] || "",
    area: item.area || item.cities?.[0] || "",
    ownerWpUserId: Number(item.ownerWpUserId || 0),
    ownerRatingAverage: Number(item.ownerRatingAverage || 0),
    ownerRatingCount: Number(item.ownerRatingCount || 0),
  };
}

function buildAdDetailPath(ad: AdData) {
  return ad.sourceKind === "job"
    ? `/offres-emploi/${buildListingSlug(ad.id, ad.title, "offre")}`
    : `/petites-annonces/${buildListingSlug(ad.id, ad.title, "annonce")}`;
}

function mapAdDataToDetailItem(ad: AdData) {
  if (ad.sourceKind === "job") {
    return {
      ...ad,
      company: ad.seller,
      companyLetter: ad.sellerLetter,
      companyColor: ad.sellerColor,
      profilePhoto: ad.sellerProfilePhoto || "",
      deadline: ad.deadline || "",
      contact: ad.contact || "",
      email: ad.email || "",
    };
  }

  return {
    ...ad,
    profilePhoto: ad.sellerProfilePhoto || "",
    contact: ad.contact || "",
    email: ad.email || "",
  };
}

function sortAdsByDateDescending<T extends AdData>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftDate = new Date(left.date || 0).getTime();
    const rightDate = new Date(right.date || 0).getTime();
    return rightDate - leftDate;
  });
}

function sortTermsByDisplayOrder(terms: TaxonomyTermResult[]) {
  return [...terms].sort((left, right) => {
    const leftOrder = Number(left.order ?? 0);
    const rightOrder = Number(right.order ?? 0);
    if (leftOrder === rightOrder) {
      return left.name.localeCompare(right.name, "fr", { sensitivity: "base" });
    }
    return leftOrder - rightOrder;
  });
}

function buildUniqueNames(terms: TaxonomyTermResult[]) {
  return Array.from(new Set(terms.map((term) => term.name.trim()).filter(Boolean)));
}

function parseAdPriceValue(value: string) {
  const normalized = String(value || "")
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function Union() {
  return (
    <div className="relative shrink-0 size-[15px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <path d={svgPaths.p1d0f4800} fill="var(--fill-0, #27624f)" id="Union" />
      </svg>
    </div>
  );
}

type LogoTextProps = {
  text: string;
  bg: string;
};

function LogoText({ text, bg, image, alt }: LogoTextProps & { image?: string; alt?: string }) {
  return (
    <div className="relative flex size-[32px] shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: bg }}>
      {image ? (
        <AppImage alt={alt || text} className="h-full w-full object-cover" src={image} eager />
      ) : (
        <span className="text-[12px] font-bold leading-none text-white">{text}</span>
      )}
    </div>
  );
}

function truncateJobExcerpt(value?: string, maxLength = 20) {
  const excerpt = String(value || "").replace(/\s+/g, " ").trim();
  if (!excerpt) {
    return "";
  }
  if (excerpt.length <= maxLength) {
    return excerpt;
  }
  return `${excerpt.slice(0, maxLength).trimEnd()}...`;
}

function Ads({ className }: { className?: string }) {
  return (
    <div className={className || "relative h-[216px] w-[min(280px,82vw)] rounded-[12px] bg-[#27624f] sm:w-[180px]"} data-name="Ads">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip px-[10px] py-[81px] relative size-full">
          <div className="content-stretch flex flex-col gap-[14.488px] items-center justify-center relative shrink-0">
            <div className="relative shrink-0 size-[22.859px]" data-name="Union">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.8584 22.8584">
                <path d={svgPaths.p165fc700} fill="var(--fill-0, white)" id="Union" />
              </svg>
            </div>
            <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[19.487px] text-white uppercase whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[normal]">Votre Pub ICI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Featured "Petites Annonces" card
function FeaturedCard({ isBlended }: { isBlended: boolean }) {
  return (
    <div className="relative h-[240px] w-[min(280px,82vw)] shrink-0 cursor-pointer overflow-hidden rounded-[12px] bg-[#15181d] prototype-listing-card sm:w-[180px]">
      <div className="absolute inset-0">
        <img alt="" className="absolute size-full object-cover" loading="lazy" src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1080&q=80&fit=crop" />
        <div className="absolute bg-gradient-to-b from-transparent to-[#15181d] inset-0" />
      </div>
      <div className="relative flex flex-col justify-end size-full p-[15px]">
        <div className="flex flex-col gap-[8px]">
          <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold text-[20px] text-white" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[1.2]">{isBlended ? "Annonces" : <>Petites<br/>Annonces</>}</p>
          </div>
          <div className="flex flex-col font-['Roboto_Flex:Medium',sans-serif] font-medium text-[12px] text-[#a3a3a3]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[1.4]">{isBlended ? "Petites annonces et offres d'emploi réunies." : "Achetez et vendez facilement."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCardGalleryImages(ad: AdData) {
  return Array.from(new Set([...(ad.images || []), ad.image].filter(Boolean)));
}

function GalleryChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d={direction === "left" ? "M14.5 6.5 9 12l5.5 5.5" : "M9.5 6.5 15 12l-5.5 5.5"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}


function ClassifiedCardMedia({
  ad,
}: {
  ad: AdData;
}) {
  const galleryImages = useMemo(() => getCardGalleryImages(ad), [ad]);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = galleryImages.length > 1;
  const activeImage = galleryImages[activeIndex] || ad.image || "/image-placeholder.png";

  useEffect(() => {
    setActiveIndex(0);
  }, [ad.id, ad.image, galleryImages.length]);

  const showPrevImage = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActiveIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const showNextImage = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActiveIndex((current) => (current + 1) % galleryImages.length);
  }, [galleryImages.length]);

  return (
    <div className="relative h-[132px] w-full shrink-0 overflow-hidden rounded-[6px]">
      <AppImage alt={ad.title} className="absolute inset-0 size-full rounded-[6px] object-cover" src={activeImage} />
      <div className="absolute left-[10px] top-[10px] inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
        <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <path d="M4 7.75A2.75 2.75 0 0 1 6.75 5h1.43c.54 0 1.05-.25 1.38-.68l.47-.6c.33-.43.84-.68 1.38-.68h1.18c.54 0 1.05.25 1.38.68l.47.6c.33.43.84.68 1.38.68h1.43A2.75 2.75 0 0 1 20 7.75v8.5A2.75 2.75 0 0 1 17.25 19h-10.5A2.75 2.75 0 0 1 4 16.25v-8.5Z" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.7" />
        </svg>
        <span>{galleryImages.length}</span>
      </div>
      {hasMultipleImages ? (
        <>
          <div className="pointer-events-none absolute bottom-[10px] left-1/2 inline-flex -translate-x-1/2 items-center rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            {activeIndex + 1}/{galleryImages.length}
          </div>
          <button
            aria-label="Photo précédente"
            className="gallery-nav-control absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#111111] opacity-0 transition-[opacity,background-color] duration-300 group-hover:opacity-100 focus:opacity-100 hover:bg-[#f7f7f7]"
            onClick={showPrevImage}
            type="button"
          >
            <GalleryChevron direction="left" />
          </button>
          <button
            aria-label="Photo suivante"
            className="gallery-nav-control absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#111111] opacity-0 transition-[opacity,background-color] duration-300 group-hover:opacity-100 focus:opacity-100 hover:bg-[#f7f7f7]"
            onClick={showNextImage}
            type="button"
          >
            <GalleryChevron direction="right" />
          </button>
        </>
      ) : null}
    </div>
  );
}

// Regular Ad Card (for main grid)
function AdCard({ ad, onClick }: { ad: AdData; onClick?: () => void }) {
  return (
    <ClassifiedGridCard
      title={ad.title}
      price={ad.sourceKind === "job" ? ad.category : formatListingMoney(ad.price, ad.currency)}
      location={ad.location}
      onClick={onClick}
      media={<ClassifiedCardMedia ad={ad} />}
      badge={ad.ownerPlanId ? <ListingOwnerPlanBadge className="absolute right-3 top-3 z-20" planId={ad.ownerPlanId} /> : null}
      className="w-full md:basis-[calc(50%-7px)] md:max-w-[calc(50%-7px)] lg:w-[180px] lg:max-w-[180px] lg:basis-[180px] lg:shrink-0"
    />
  );
}

function JobLikeAdCard({ ad, onClick }: { ad: AdData; onClick?: () => void }) {
  const statusLabel = getJobStatusLabel(ad.deadline);
  const isClosed = getJobStatus(ad.deadline) === "closed";
  const excerpt = truncateJobExcerpt(ad.excerpt || ad.description, 20);
  return (
    <div onClick={onClick} className="group ui-surface relative h-[236px] w-[min(280px,82vw)] shrink-0 cursor-pointer overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card sm:w-[180px]">
      <div aria-hidden="true" className="ui-border absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      <div className="flex h-full flex-col justify-between gap-[18px] p-[5px]">
        <div className="flex h-full flex-col justify-between px-[14px] py-[14px]">
          <div className="content-stretch relative flex w-full items-start gap-[12px]">
            <LogoText text={ad.sellerLetter} bg={ad.sellerColor} image={ad.companyLogo} alt={ad.seller} />
            <div className="content-stretch relative flex min-h-px min-w-px flex-[1_0_0] flex-col items-start gap-[6px] pr-[6px]">
              <div className="ui-text-main flex min-h-[34px] flex-col justify-start font-['Roboto_Flex:Bold',sans-serif] text-[14px] font-bold" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="line-clamp-2 break-normal leading-[1.2] [text-wrap:balance]">{ad.seller}</p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-[9px]">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="h-[12px] relative shrink-0 w-[13px]">
                <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]">
                  <Group />
                </div>
              </div>
              <span className="ui-text-soft line-clamp-1 min-w-0 break-normal font-['Roboto_Flex:Regular',sans-serif] text-[11px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                {ad.location}
              </span>
            </div>
            <div className="min-w-0">
              <div className="ui-text-main flex min-h-[36px] flex-col font-['Roboto_Flex:SemiBold',sans-serif] text-[14px] font-semibold" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="overflow-hidden leading-[1.25] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [text-overflow:clip]">{ad.title}</p>
              </div>
            </div>
            {excerpt ? (
              <p className="ui-text-muted text-[11px] leading-[1.35]">
                {excerpt}
              </p>
            ) : null}
            <div className="flex justify-start">
              <span className={clsx("rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em]", isClosed ? "bg-[#fff1f2] text-[#27624f]" : "bg-[#ecfdf3] text-[#15803d]")}>
                {statusLabel}
              </span>
            </div>
            <div className="ui-text-muted flex flex-col gap-1 text-[10px] leading-[1.3]">
              <span>{formatRelativeTime(ad.date)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div />
            {ad.isAdminCreated && (
              <div className="shrink-0 rounded-[8px] bg-[#fff1f2] p-1.5">
                <Union />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallJobAdCard({ ad, onClick }: { ad: AdData; onClick?: () => void }) {
  const statusLabel = getJobStatusLabel(ad.deadline);
  const isClosed = getJobStatus(ad.deadline) === "closed";
  const excerpt = truncateJobExcerpt(ad.excerpt || ad.description, 20);
  return (
    <div onClick={onClick} className="group ui-surface relative h-[236px] w-[min(280px,82vw)] shrink-0 cursor-pointer overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card sm:w-[180px]">
      <div aria-hidden="true" className="ui-border absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      <div className="flex h-full flex-col justify-between gap-[18px] p-[5px]">
        <div className="flex h-full flex-col justify-between px-[14px] py-[14px]">
          <div className="content-stretch relative flex w-full items-start gap-[12px]">
            <LogoText text={ad.sellerLetter} bg={ad.sellerColor} image={ad.companyLogo} alt={ad.seller} />
            <div className="content-stretch relative flex min-h-px min-w-px flex-[1_0_0] flex-col items-start gap-[6px] pr-[6px]">
              <div className="ui-text-main flex min-h-[34px] flex-col justify-start font-['Roboto_Flex:Bold',sans-serif] text-[14px] font-bold" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="line-clamp-2 break-normal leading-[1.2] [text-wrap:balance]">{ad.seller}</p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-[9px]">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="h-[12px] relative shrink-0 w-[13px]">
                <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]">
                  <Group />
                </div>
              </div>
              <span className="ui-text-soft line-clamp-1 min-w-0 break-normal font-['Roboto_Flex:Regular',sans-serif] text-[11px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                {ad.location}
              </span>
            </div>
            <div className="min-w-0">
              <div className="ui-text-main flex min-h-[36px] flex-col font-['Roboto_Flex:SemiBold',sans-serif] text-[14px] font-semibold" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="overflow-hidden leading-[1.25] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [text-overflow:clip]">{ad.title}</p>
              </div>
            </div>
            {excerpt ? (
              <p className="ui-text-muted text-[11px] leading-[1.35]">
                {excerpt}
              </p>
            ) : null}
            <div className="flex justify-start">
              <span className={clsx("rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em]", isClosed ? "bg-[#fff1f2] text-[#27624f]" : "bg-[#ecfdf3] text-[#15803d]")}>
                {statusLabel}
              </span>
            </div>
            <div className="ui-text-muted flex flex-col gap-1 text-[10px] leading-[1.3]">
              <span>{formatRelativeTime(ad.date)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div />
            {ad.isAdminCreated && (
              <div className="shrink-0 rounded-[8px] bg-[#fff1f2] p-1.5">
                <Union />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdCardSkeleton() {
  return (
    <div className="ui-card-flat h-[240px] w-full min-w-0 animate-pulse rounded-[12px] p-[5px] md:basis-[calc(50%-7px)] md:max-w-[calc(50%-7px)] lg:w-[180px] lg:max-w-[180px] lg:basis-[180px] lg:shrink-0">
      <div className="h-[132px] w-full rounded-[6px] bg-black/5 dark:bg-white/10" />
      <div className="mt-4 space-y-2 px-[10px]">
        <div className="h-3 w-3/4 rounded bg-black/5 dark:bg-white/10" />
        <div className="h-3 w-1/2 rounded bg-black/5 dark:bg-white/10" />
        <div className="h-3 w-2/3 rounded bg-black/5 dark:bg-white/10" />
      </div>
    </div>
  );
}

function AdListCardSkeleton() {
  return (
    <div className="ui-card-flat w-full animate-pulse rounded-[16px] p-4">
      <div className="flex gap-4">
        <div className="h-[120px] w-[120px] shrink-0 rounded-[12px] bg-black/5 dark:bg-white/10" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/4 rounded bg-black/5 dark:bg-white/10" />
          <div className="h-6 w-2/3 rounded bg-black/5 dark:bg-white/10" />
          <div className="h-4 w-full rounded bg-black/5 dark:bg-white/10" />
          <div className="h-4 w-5/6 rounded bg-black/5 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function ListQuickActionIcons({
  canSave,
  isSaved,
  isSaving,
  onSave,
  onShare,
  contactHref,
}: {
  canSave: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onSave: () => void;
  onShare: () => void;
  contactHref?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canSave ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSave();
          }}
          disabled={isSaving}
          aria-label="Enregistrer"
          className={clsx(
            "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
            isSaved
              ? "border-[#27624f] bg-[#27624f] text-white shadow-[0_10px_24px_rgba(204,32,42,0.18)]"
              : "ui-surface ui-border ui-text-main hover:border-[#27624f] hover:text-[#27624f]",
            isSaving ? "cursor-not-allowed opacity-60" : "",
          )}
        >
          <svg className="h-[18px] w-[18px]" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.435 6.582a5.54 5.54 0 00-7.84 0L12 8.177l-1.595-1.595a5.54 5.54 0 00-7.84 7.84l1.595 1.595L12 21.857l7.84-5.84 1.595-1.595a5.54 5.54 0 000-7.84z"
            />
          </svg>
        </button>
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onShare();
        }}
        aria-label="Partager"
        className="ui-surface ui-border ui-text-main inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:border-[#27624f] hover:text-[#27624f]"
      >
        <ShareArrowIcon className="h-[18px] w-[18px]" />
      </button>
      {contactHref ? (
        <a
          href={contactHref}
          onClick={(event) => {
            event.stopPropagation();
          }}
          aria-label="Contacter"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#22c55e] text-white transition hover:bg-[#16a34a]"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-3 3-3-3z" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}

function ClassifiedListMedia({
  ad,
}: {
  ad: AdData;
}) {
  const galleryImages = useMemo(() => getCardGalleryImages(ad), [ad]);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = galleryImages.length > 1;
  const activeImage = galleryImages[activeIndex] || ad.image || "/image-placeholder.png";

  useEffect(() => {
    setActiveIndex(0);
  }, [ad.id, ad.image, galleryImages.length]);

  const showPrevImage = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActiveIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const showNextImage = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActiveIndex((current) => (current + 1) % galleryImages.length);
  }, [galleryImages.length]);

  return (
    <div className="group relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[10px] bg-[#f5f5f5] sm:aspect-auto sm:w-[180px] sm:self-stretch">
      <AppImage alt={ad.title} className="absolute inset-0 h-full w-full object-cover" src={activeImage} eager />
      {galleryImages.length > 1 ? (
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          {galleryImages.length} photos
        </span>
      ) : null}
      {hasMultipleImages ? (
        <>
          <div className="pointer-events-none absolute bottom-[10px] left-1/2 inline-flex -translate-x-1/2 items-center rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            {activeIndex + 1}/{galleryImages.length}
          </div>
          <button
            aria-label="Photo précédente"
            className="gallery-nav-control absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#111111] opacity-0 transition-[opacity,background-color] duration-300 group-hover:opacity-100 focus:opacity-100 hover:bg-[#f7f7f7]"
            onClick={showPrevImage}
            type="button"
          >
            <GalleryChevron direction="left" />
          </button>
          <button
            aria-label="Photo suivante"
            className="gallery-nav-control absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#111111] opacity-0 transition-[opacity,background-color] duration-300 group-hover:opacity-100 focus:opacity-100 hover:bg-[#f7f7f7]"
            onClick={showNextImage}
            type="button"
          >
            <GalleryChevron direction="right" />
          </button>
        </>
      ) : null}
    </div>
  );
}

function AdListCard({
  ad,
  onClick,
  onSellerClick,
  onCategoryClick,
  canSave,
  isSaved,
  isSaving,
  onToggleSave,
  onShare,
  contactHref,
}: {
  ad: AdData;
  onClick?: () => void;
  onSellerClick?: (ad: AdData) => void;
  onCategoryClick?: (category: string) => void;
  canSave: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  contactHref?: string | null;
}) {
  const summary = ad.excerpt || ad.description;

  return (
    <article
      onClick={onClick}
      className="group ui-surface ui-border relative flex w-full cursor-pointer flex-col rounded-[12px] border p-2.5 text-left prototype-listing-card transition-colors duration-300 hover:border-[#27624f]"
    >
      <div className="flex flex-col gap-2.5 sm:min-h-[146px] sm:flex-row sm:items-stretch">
        <ClassifiedListMedia ad={ad} />
        <div className="min-w-0 flex flex-1 flex-col sm:self-stretch">
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-1.5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSellerClick?.(ad);
                    }}
                    className="ui-text-muted text-[12px] font-medium transition-colors hover:text-[#27624f]"
                  >
                    {ad.seller}
                  </button>
                  {ad.ownerPlanId ? <ListingOwnerPlanBadge planId={ad.ownerPlanId} /> : null}
                </div>
                <div className="text-[18px] font-bold text-[#27624f]">{formatListingMoney(ad.price, ad.currency)}</div>
                <h3>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onClick?.();
                    }}
                    className="ui-text-main text-left text-[19px] font-semibold leading-[1.15] transition-colors hover:text-[#27624f]"
                  >
                    {ad.title}
                  </button>
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="ui-text-soft flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                    <span>{ad.location}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCategoryClick?.(ad.category);
                      }}
                      className="transition-colors hover:text-[#27624f]"
                    >
                      {ad.category}
                    </button>
                    {ad.condition ? <ListingConditionBadge className="px-2.5 py-1 text-[10px]">{ad.condition}</ListingConditionBadge> : null}
                  </div>
                </div>
              </div>
              <div className="shrink-0 self-start">
                <ListQuickActionIcons
                  canSave={canSave}
                  isSaved={isSaved}
                  isSaving={isSaving}
                  onSave={onToggleSave}
                  onShare={onShare}
                  contactHref={contactHref}
                />
              </div>
            </div>
            <p className="ui-text-muted line-clamp-2 text-[13px] leading-[1.4]">{summary}</p>
            {ad.productTag ? (
              <div className="flex flex-wrap gap-2">
                <span className="ui-tag ui-surface-soft ui-text-muted rounded-full px-3 py-1.5 text-[11px] font-medium">
                  {ad.productTag}
                </span>
              </div>
            ) : null}
            <div className="mt-auto flex items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="ui-surface-soft ui-text-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formatRelativeTime(ad.date)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function JobLikeAdListCard({
  ad,
  onClick,
  canSave,
  isSaved,
  isSaving,
  onToggleSave,
  onShare,
  contactHref,
}: {
  ad: AdData;
  onClick?: () => void;
  canSave: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  contactHref?: string | null;
}) {
  const statusLabel = getJobStatusLabel(ad.deadline);
  const isClosed = getJobStatus(ad.deadline) === "closed";
  const visibleSkills = (ad.skills || []).slice(0, 5);
  const excerpt = String(ad.excerpt || ad.description || "").trim();

  return (
    <article
      onClick={onClick}
      className="group ui-surface ui-border relative flex w-full cursor-pointer flex-col rounded-[12px] border p-3 text-left prototype-listing-card transition-colors duration-300 hover:border-[#27624f]"
    >
      <div className="flex items-start gap-4">
        <LogoText text={ad.sellerLetter} bg={ad.sellerColor} image={ad.companyLogo} alt={ad.seller} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2 pr-2">
              <div className="flex items-start gap-2">
                <span className="ui-text-main line-clamp-2 text-[14px] font-semibold leading-[1.25] [text-wrap:balance]">{ad.seller}</span>
                <span className={clsx("rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em]", isClosed ? "bg-[#fff1f2] text-[#27624f]" : "bg-[#ecfdf3] text-[#15803d]")}>
                  {statusLabel}
                </span>
              </div>
              <h3>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClick?.();
                  }}
                  className="ui-text-main text-left text-[19px] font-semibold leading-[1.15] transition-colors hover:text-[#27624f]"
                >
                  {ad.title}
                </button>
              </h3>
              <div className="ui-text-soft text-[12px]">{ad.location}</div>
              {excerpt ? (
                <p className="ui-text-muted text-[13px] leading-[1.5]">
                  {excerpt}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {ad.isAdminCreated ? (
                <div className="shrink-0 rounded-[8px] bg-[#fff1f2] p-1.5">
                  <Union />
                </div>
              ) : null}
              <ListQuickActionIcons
                canSave={canSave}
                isSaved={isSaved}
                isSaving={isSaving}
                onSave={onToggleSave}
                onShare={onShare}
                contactHref={contactHref}
              />
            </div>
          </div>
          {visibleSkills.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleSkills.map((skill) => (
                <span key={`${ad.id}-${skill}`} className="ui-tag ui-surface-soft ui-text-muted rounded-full px-3 py-1.5 text-[11px] font-medium">
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] leading-[1.45] text-[#737373] dark:text-[#a1a1aa]">
            {ad.experienceYears ? <span className="whitespace-nowrap">{"Expérience : "}{ad.experienceYears}</span> : null}
            {ad.deadline ? (
              <span className="whitespace-nowrap">Date limite : {formatListingMetaDate(ad.deadline)}</span>
            ) : null}
            <span className="whitespace-nowrap">{formatRelativeTime(ad.date)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PetitesAnnoncesPage() {
  const { isLoggedIn, user, userPlan, setShowLoginModal } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [classifiedJobBlendEnabled, setClassifiedJobBlendEnabled] = useState(false);
  const classifiedFilterCatalog = usePublicListingFilterCatalog("classified");
  const jobFilterCatalog = usePublicListingFilterCatalog("job", classifiedJobBlendEnabled);
  const [selectedCategory, setSelectedCategory] = useState(() => readPublicListStringParamFromUrl("category", "Tous") || "Tous");
  const [selectedType, setSelectedType] = useState(() => readPublicListStringParamFromUrl("type", "Tous") || "Tous");
  const [selectedProductTag, setSelectedProductTag] = useState(() => readPublicListStringParamFromUrl("tag", "Tous") || "Tous");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedLocationCity, setExpandedLocationCity] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState(() => readPublicListStringParamFromUrl("city", "Toutes") || "Toutes");
  const [selectedArea, setSelectedArea] = useState(() => readPublicListStringParamFromUrl("area", "Toutes") || "Toutes");
  const [locationSearch, setLocationSearch] = useState("");
  const [priceMin, setPriceMin] = useState(() => readPublicListStringParamFromUrl("priceMin", ""));
  const [priceMax, setPriceMax] = useState(() => readPublicListStringParamFromUrl("priceMax", ""));
  const [priceCurrency, setPriceCurrency] = useState(() => readPublicListStringParamFromUrl("currency", "Toutes") || "Toutes");
  const [ownerFilter, setOwnerFilter] = useState(() => {
    const nextOwnerFilter = readPublicListNumberParamFromUrl("ownerWpUserId", 0);
    return Number.isFinite(nextOwnerFilter) && nextOwnerFilter > 0 ? nextOwnerFilter : 0;
  });
  const [ownerFilterLabel, setOwnerFilterLabel] = useState(() => readPublicListStringParamFromUrl("company", ""));
  const [searchQuery, setSearchQuery] = useState(() => readPublicListStringParamFromUrl("search", ""));
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(() => readPublicListStringParamFromUrl("search", ""));
  const [currentPage, setCurrentPage] = useState(() => readPublicListPageFromUrl());
  const [activeFilterAccordion, setActiveFilterAccordion] = useState<"categories" | "location" | null>(
    "categories",
  );
  const [isDesktopFilters, setIsDesktopFilters] = useState(false);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);
  const [viewMode, setViewMode] = useState<PublicListingViewMode>("list");
  const [listVisibleCount, setListVisibleCount] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedCategoryFiltersRef = useRef(false);
  const hasInitializedLocationFiltersRef = useRef(false);
  const isSyncingFiltersFromUrlRef = useRef(false);
  const resultsScrollRef = useScrollResultsIntoView<HTMLDivElement>(
    [
      selectedCategory,
      selectedType,
      selectedProductTag,
      selectedCity,
      selectedArea,
      priceMin,
      priceMax,
      priceCurrency,
      ownerFilter,
      debouncedSearchQuery,
    ].join("|"),
  );
  const isCategoriesOpen = activeFilterAccordion === "categories";
  const toggleFilterAccordion = (accordion: "categories" | "location") => {
    setActiveFilterAccordion((current) => (current === accordion ? null : accordion));
  };
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);
  const [isModalContactVisible, setIsModalContactVisible] = useState(false);
  const [isModalSaved, setIsModalSaved] = useState(false);
  const [isModalSaveReady, setIsModalSaveReady] = useState(false);
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ title: string; url: string; text?: string } | null>(null);
  const [quickSavedState, setQuickSavedState] = useState<Record<string, boolean>>({});
  const [quickSavingKey, setQuickSavingKey] = useState<string | null>(null);
  const [relatedAds, setRelatedAds] = useState<AdData[]>([]);
  const [remoteAds, setRemoteAds] = useState<AdData[]>([]);
  const [featuredAdsSource, setFeaturedAdsSource] = useState<AdData[]>([]);
  const [ownerPlanMap, setOwnerPlanMap] = useState<Record<number, PremiumOwnerPlanId>>({});
  const [inlineAds, setInlineAds] = useState<PublicAdItem[]>([]);
  const [remoteClassifiedCategoryTerms, setRemoteClassifiedCategoryTerms] = useState<TaxonomyTermResult[]>([]);
  const [remoteJobCategoryTerms, setRemoteJobCategoryTerms] = useState<TaxonomyTermResult[]>([]);
  const [remoteClassifiedLocationTerms, setRemoteClassifiedLocationTerms] = useState<TaxonomyTermResult[]>([]);
  const [remoteJobLocationTerms, setRemoteJobLocationTerms] = useState<TaxonomyTermResult[]>([]);
  const [remoteFetchState, setRemoteFetchState] = useState<"loading" | "ready" | "error">("loading");
  const [hasResolvedInitialListings, setHasResolvedInitialListings] = useState(false);
  const [categoryFetchState, setCategoryFetchState] = useState<"loading" | "ready" | "error">("loading");
  const [listingsPagination, setListingsPagination] = useState({
    page: 1,
    perPage: 30,
    total: 0,
    totalPages: 1,
  });
  const [interactionError, setInteractionError] = useState("");
  const isEmailVerificationRequired = isLoggedIn && user?.emailVerified === false;
  const hasPaidContactAccess = userPlan === "essentiel" || userPlan === "business";
  const getAdQuickKey = useCallback((ad: AdData) => `${ad.sourceKind}:${ad.id}`, []);
  useEffect(() => {
    const classifiedCatalog = classifiedFilterCatalog.catalog;
    const requiredJobCatalog = classifiedJobBlendEnabled ? jobFilterCatalog.catalog : null;

    if (!classifiedCatalog || (classifiedJobBlendEnabled && !requiredJobCatalog)) {
      if (classifiedFilterCatalog.error || (classifiedJobBlendEnabled && jobFilterCatalog.error)) {
        setCategoryFetchState("error");
      }
      return;
    }

    setRemoteClassifiedCategoryTerms(classifiedCatalog.categories);
    setRemoteClassifiedLocationTerms(classifiedCatalog.locations);
    setRemoteJobCategoryTerms(requiredJobCatalog?.categories || []);
    setRemoteJobLocationTerms(requiredJobCatalog?.locations || []);
    setCategoryFetchState("ready");
  }, [classifiedFilterCatalog.catalog, classifiedFilterCatalog.error, classifiedJobBlendEnabled, jobFilterCatalog.catalog, jobFilterCatalog.error]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewport = () => {
      const isDesktop = window.innerWidth >= 1024;
      setIsDesktopFilters(isDesktop);
      if (isDesktop) {
        setActiveFilterAccordion((current) => current ?? "categories");
        setIsMobileFiltersVisible(false);
      }
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPublicSiteConfig() {
      try {
        const response = await fetch("/api/public/site-config", { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        if (!cancelled && response.ok) {
          setClassifiedJobBlendEnabled(Boolean(payload?.classifiedJobBlendEnabled));
        }
      } catch {
        if (!cancelled) {
          setClassifiedJobBlendEnabled(false);
        }
      }
    }

    void loadPublicSiteConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedCategory("Tous");
    setSelectedType("Tous");
    resetToFirstPage();
  }, [classifiedJobBlendEnabled]);

  useEffect(() => {
    if (isSyncingFiltersFromUrlRef.current) {
      return;
    }

    if (!hasInitializedCategoryFiltersRef.current) {
      hasInitializedCategoryFiltersRef.current = true;
      return;
    }

    setSelectedType("Tous");
    setSelectedProductTag("Tous");
  }, [selectedCategory]);

  useEffect(() => {
    if (isSyncingFiltersFromUrlRef.current) {
      return;
    }

    if (!hasInitializedLocationFiltersRef.current) {
      hasInitializedLocationFiltersRef.current = true;
      return;
    }

    setSelectedArea("Toutes");
  }, [selectedCity]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      resetToFirstPage();
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const normalizedSelectedCity = selectedCity.trim().toLowerCase();
  const normalizedSelectedArea = selectedArea.trim().toLowerCase();

  const filteredAdsByLocation = useMemo(() => {
    const byLocation = remoteAds.filter((ad) => {
      const adLocation = String(ad.location || "").trim().toLowerCase();
      const adCity = String(ad.city || "").trim().toLowerCase();
      const adArea = String(ad.area || "").trim().toLowerCase();

      const matchesCity =
        normalizedSelectedCity === "toutes" ||
        normalizedSelectedCity.length === 0 ||
        adCity === normalizedSelectedCity ||
        adLocation.includes(normalizedSelectedCity);

      const matchesArea =
        normalizedSelectedArea === "toutes" ||
        normalizedSelectedArea.length === 0 ||
        adArea === normalizedSelectedArea ||
        adLocation.includes(normalizedSelectedArea);

      return matchesCity && matchesArea;
    });

    if (ownerFilter <= 0) {
      return byLocation;
    }

    return byLocation.filter((ad) => Number(ad.ownerWpUserId || 0) === ownerFilter);
  }, [normalizedSelectedArea, normalizedSelectedCity, ownerFilter, remoteAds]);
  const sponsoredAds = useMemo(
    () =>
      featuredAdsSource
        .filter((ad) => ad.featured)
        .map((ad) => {
          if (ad.sourceKind !== "classified") {
            return ad;
          }

          const ownerWpUserId = Number(ad.ownerWpUserId || 0);
          return {
            ...ad,
            ownerPlanId: ownerWpUserId > 0 ? ownerPlanMap[ownerWpUserId] : undefined,
          };
        }),
    [featuredAdsSource, ownerPlanMap],
  );
  const classifiedOwnerIds = useMemo(
    () =>
      Array.from(
        new Set(
          [...remoteAds, ...featuredAdsSource]
            .filter((ad) => ad.sourceKind === "classified")
            .map((ad) => Number(ad.ownerWpUserId || 0))
            .filter((value) => Number.isFinite(value) && value > 0),
        ),
      ),
    [featuredAdsSource, remoteAds],
  );
  useEffect(() => {
    let cancelled = false;

    const loadOwnerPlans = async () => {
      if (classifiedOwnerIds.length === 0) {
        if (!cancelled) {
          setOwnerPlanMap({});
        }
        return;
      }

      try {
        const response = await fetch("/api/public/listing-owner-plans?ids=" + classifiedOwnerIds.join(","), {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.items) {
          throw new Error("Unable to load owner plans");
        }

        const nextMap = Object.fromEntries(
          (Array.isArray(payload.items) ? payload.items : [])
            .map((entry) => {
              const wpUserId = Number(entry?.wpUserId || 0);
              const planId = entry?.planId;
              if (!Number.isFinite(wpUserId) || wpUserId <= 0 || (planId !== "essentiel" && planId !== "business")) {
                return null;
              }
              return [wpUserId, planId];
            })
            .filter(Boolean),
        ) as Record<number, PremiumOwnerPlanId>;

        if (!cancelled) {
          setOwnerPlanMap(nextMap);
        }
      } catch {
        if (!cancelled) {
          setOwnerPlanMap({});
        }
      }
    };

    void loadOwnerPlans();

    return () => {
      cancelled = true;
    };
  }, [classifiedOwnerIds]);
  const activeOwnerDisplay = useMemo(() => {
    if (ownerFilter <= 0) {
      return null;
    }

    const matchingAd =
      remoteAds.find((ad) => Number(ad.ownerWpUserId || 0) === ownerFilter) ??
      featuredAdsSource.find((ad) => Number(ad.ownerWpUserId || 0) === ownerFilter) ??
      null;

    const name = matchingAd?.seller || ownerFilterLabel || `Annonceur #${ownerFilter}`;
    const image = matchingAd?.sellerProfilePhoto || "";
    const initial = String(name || "A").trim().charAt(0).toUpperCase() || "A";

    return { name, image, initial };
  }, [featuredAdsSource, ownerFilter, ownerFilterLabel, remoteAds]);
  const topLevelCategories = useMemo(
    () =>
      sortTermsByDisplayOrder(
        remoteClassifiedCategoryTerms.filter(
          (term) =>
            !term.parentId &&
            !term.parentName &&
            String(term.slug || "").trim().toLowerCase() !== "offres-d-emploi",
        ),
      ),
    [remoteClassifiedCategoryTerms],
  );
  const selectedTopLevelCategory = useMemo(
    () =>
      topLevelCategories.find(
        (term) => term.name.trim().toLowerCase() === selectedCategory.trim().toLowerCase(),
      ) ?? null,
    [selectedCategory, topLevelCategories],
  );
  const selectedTopLevelCategorySlug = (selectedTopLevelCategory?.slug || "").trim().toLowerCase();
  const shouldMergeJobsIntoSelectedCategory =
    selectedTopLevelCategorySlug === "offres-d-emploi" || selectedTopLevelCategorySlug === "emploi";
  const activeCategoryFilter =
    selectedCategory !== "Tous" ? selectedCategory : "";
  const activeClassifiedCategoryChildren = useMemo(
    () =>
      selectedCategory === "Tous"
        ? []
        : sortTermsByDisplayOrder(
            remoteClassifiedCategoryTerms.filter(
              (term) => (term.parentName || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase(),
            ),
          ),
    [remoteClassifiedCategoryTerms, selectedCategory],
  );
  const selectedClassifiedCategoryTerm = useMemo(
    () =>
      topLevelCategories.find(
        (term) => term.name.trim().toLowerCase() === selectedCategory.trim().toLowerCase(),
      ) ?? null,
    [selectedCategory, topLevelCategories],
  );
  const selectedClassifiedTypeTerm = useMemo(
    () =>
      selectedType === "Tous"
        ? null
        : activeClassifiedCategoryChildren.find(
            (term) => term.name.trim().toLowerCase() === selectedType.trim().toLowerCase(),
          ) ?? null,
    [activeClassifiedCategoryChildren, selectedType],
  );
  const selectedTypeTargetsJobs = shouldMergeJobsIntoSelectedCategory;
  const categoryNodes = useMemo(
    () =>
      topLevelCategories.map((term) => {
        const normalizedSlug = String(term.slug || "").trim().toLowerCase();
        const isJobsParent = normalizedSlug === "offres-d-emploi" || normalizedSlug === "emploi";
        const childTerms = isJobsParent
          ? sortTermsByDisplayOrder(remoteJobCategoryTerms.filter((candidate) => !candidate.parentId && !candidate.parentName))
          : sortTermsByDisplayOrder(
              remoteClassifiedCategoryTerms.filter(
                (candidate) => (candidate.parentName || "").trim().toLowerCase() === term.name.trim().toLowerCase(),
              ),
            );

        return {
          label: term.name,
          value: term.name,
          children: childTerms.map((child) => ({
            label: child.name,
            value: child.name,
          })),
        };
      }),
    [remoteClassifiedCategoryTerms, remoteJobCategoryTerms, topLevelCategories],
  );
  const displayProductTags = useMemo(() => {
    if (selectedCategory === "Tous" || selectedTypeTargetsJobs) {
      return [];
    }

    if (selectedType === "Tous") {
      const aggregatedChildTags = activeClassifiedCategoryChildren.flatMap((term) =>
        term.productTagsConfigured ? term.productTagNames || [] : [],
      );
      const categoryTags = selectedClassifiedCategoryTerm?.productTagsConfigured
        ? selectedClassifiedCategoryTerm.productTagNames || []
        : [];

      return Array.from(new Set([...categoryTags, ...aggregatedChildTags].filter(Boolean)));
    }

    const resolvedTagNames =
      (selectedClassifiedTypeTerm?.productTagsConfigured && (selectedClassifiedTypeTerm.productTagNames || []).length > 0)
        ? selectedClassifiedTypeTerm.productTagNames || []
        : (selectedClassifiedCategoryTerm?.productTagsConfigured ? selectedClassifiedCategoryTerm.productTagNames || [] : []);

    return Array.from(new Set(resolvedTagNames.filter(Boolean)));
  }, [
    activeClassifiedCategoryChildren,
    selectedCategory,
    selectedClassifiedCategoryTerm,
    selectedClassifiedTypeTerm,
    selectedType,
    selectedTypeTargetsJobs,
  ]);
  const activeLocationTerms = useMemo(() => {
    if (selectedTypeTargetsJobs) {
      return dedupeTaxonomyTermsByHierarchy(remoteJobLocationTerms);
    }

    if (selectedCategory === "Tous") {
      return dedupeTaxonomyTermsByHierarchy(remoteClassifiedLocationTerms);
    }

    return dedupeTaxonomyTermsByHierarchy(remoteClassifiedLocationTerms);
  }, [
    remoteClassifiedLocationTerms,
    remoteJobLocationTerms,
    selectedCategory,
    selectedTypeTargetsJobs,
  ]);
  const displayCities = useMemo(() => {
    const terms = sortTermsByDisplayOrder(
      dedupeTaxonomyTermsByHierarchy(activeLocationTerms.filter((term) => !term.parentId && !term.parentName)),
    );
    return ["Toutes", ...buildUniqueNames(terms)];
  }, [activeLocationTerms]);
  const displayAreas = useMemo(() => {
    if (selectedCity === "Toutes") {
      return ["Toutes"];
    }

    const selectedCityKey = selectedCity.trim().toLowerCase();
    const areas = sortTermsByDisplayOrder(
      dedupeTaxonomyTermsByHierarchy(activeLocationTerms.filter(
        (term) => (term.parentName || "").trim().toLowerCase() === selectedCityKey,
      )),
    );

    return ["Toutes", ...buildUniqueNames(areas)];
  }, [activeLocationTerms, selectedCity]);
  const availablePriceCurrencies = useMemo(
    () => [
      "Toutes",
      ...Array.from(
        new Set(
          remoteAds
            .filter((ad) => ad.sourceKind === "classified")
            .map((ad) => String(ad.currency || "MGA").trim().toUpperCase())
            .filter(Boolean),
        ),
      ),
    ],
    [remoteAds],
  );
  const locationNodes = useMemo(
    () =>
      sortTermsByDisplayOrder(
        dedupeTaxonomyTermsByHierarchy(activeLocationTerms.filter((term) => !term.parentId && !term.parentName)),
      ).map((term) => ({
        label: term.name,
        value: term.name,
        children: sortTermsByDisplayOrder(
          dedupeTaxonomyTermsByHierarchy(activeLocationTerms.filter(
            (candidate) => (candidate.parentName || "").trim().toLowerCase() === term.name.trim().toLowerCase(),
          )),
        ).map((child) => ({
          label: child.name,
          value: child.name,
        })),
      })),
    [activeLocationTerms],
  );
  useEffect(() => {
    if (categoryFetchState === "loading") {
      return;
    }

    if (selectedProductTag === "Tous") {
      return;
    }

    if (displayProductTags.includes(selectedProductTag)) {
      return;
    }

    setSelectedProductTag("Tous");
  }, [categoryFetchState, displayProductTags, selectedProductTag]);
  useEffect(() => {
    if (remoteFetchState === "loading") {
      return;
    }

    if (displayCities.includes(selectedCity)) {
      return;
    }

    setSelectedCity("Toutes");
  }, [displayCities, remoteFetchState, selectedCity]);

  useEffect(() => {
    if (remoteFetchState === "loading") {
      return;
    }

    if (displayAreas.includes(selectedArea)) {
      return;
    }

    setSelectedArea("Toutes");
  }, [displayAreas, remoteFetchState, selectedArea]);

  useEffect(() => {
    resetToFirstPage();
  }, [selectedArea, selectedCity]);
  useEffect(() => {
    if (remoteFetchState === "loading") {
      return;
    }

    if (priceCurrency === "Toutes") {
      return;
    }

    if (availablePriceCurrencies.includes(priceCurrency)) {
      return;
    }

    setPriceCurrency("Toutes");
  }, [availablePriceCurrencies, priceCurrency, remoteFetchState]);
  useEffect(() => {
    resetToFirstPage();
  }, [priceCurrency, priceMax, priceMin]);
  useEffect(() => {
    if (selectedCategory === "Tous") {
      setExpandedCategory(null);
      return;
    }

    setExpandedCategory(selectedCategory);
  }, [selectedCategory]);
  useEffect(() => {
    if (selectedCity === "Toutes") {
      setExpandedLocationCity(null);
      return;
    }

    setExpandedLocationCity(selectedCity);
  }, [selectedCity]);
  const isListingsLoading = remoteFetchState === "loading";
  const isInitialListingsLoading = isListingsLoading && !hasResolvedInitialListings;
  const isCategoriesLoading = categoryFetchState === "loading";
  const normalizedSearchQuery = debouncedSearchQuery.trim();
  const normalizedPriceCurrency = priceCurrency.trim().toUpperCase();
  const minPriceValue = parseAdPriceValue(priceMin);
  const maxPriceValue = parseAdPriceValue(priceMax);
  const hasActivePriceFilter =
    minPriceValue !== null ||
    maxPriceValue !== null ||
    normalizedPriceCurrency !== "TOUTES";
  const allDisplayAds = useMemo(() => {
    // Standard classified browsing is fully filtered and paginated by the
    // backend. The optional classified/job blend remains client-composed.
    if (!classifiedJobBlendEnabled) {
      return remoteAds;
    }

    const searched = normalizedSearchQuery
      ? filteredAdsByLocation.filter((ad) => {
          const haystack = [ad.title, ad.description, ad.location, ad.category, ad.seller]
            .map((value) => String(value || "").toLowerCase())
            .join(" ");
          return haystack.includes(normalizedSearchQuery.toLowerCase());
        })
      : filteredAdsByLocation;

    const priceFiltered = searched.filter((ad) => {
      if (ad.sourceKind !== "classified") {
        return !hasActivePriceFilter;
      }

      if (selectedTypeTargetsJobs) {
        return true;
      }

      const adCurrency = String(ad.currency || "MGA").trim().toUpperCase();
      if (normalizedPriceCurrency !== "TOUTES" && adCurrency !== normalizedPriceCurrency) {
        return false;
      }

      if (minPriceValue === null && maxPriceValue === null) {
        return true;
      }

      const adPrice = parseAdPriceValue(ad.price);
      if (adPrice === null) {
        return false;
      }

      if (minPriceValue !== null && adPrice < minPriceValue) {
        return false;
      }

      if (maxPriceValue !== null && adPrice > maxPriceValue) {
        return false;
      }

      return true;
    });

    if (activeCategoryFilter.length > 0) {
      if (shouldMergeJobsIntoSelectedCategory) {
        return priceFiltered.filter((ad) => {
          if (ad.sourceKind === "job") {
            return selectedType === "Tous"
              ? true
              : ad.category.trim().toLowerCase() === selectedType.trim().toLowerCase();
          }

          const isMatchingClassifiedCategory =
            ad.sourceKind === "classified" &&
            ad.category.trim().toLowerCase() === activeCategoryFilter.trim().toLowerCase();

          if (!isMatchingClassifiedCategory) {
            return false;
          }

          const matchesType =
            selectedType !== "Tous"
              ? (ad.type || "").trim().toLowerCase() === selectedType.trim().toLowerCase()
              : true;
          const matchesTag =
            selectedProductTag === "Tous" ||
            (ad.productTag || "").trim().toLowerCase() === selectedProductTag.trim().toLowerCase();

          return matchesType && matchesTag;
        });
      }

      const classifiedAds = priceFiltered.filter(
        (ad) =>
          ad.sourceKind === "classified" &&
          ad.category.trim().toLowerCase() === activeCategoryFilter.trim().toLowerCase() &&
          (
            selectedProductTag === "Tous" ||
            (ad.productTag || "").trim().toLowerCase() === selectedProductTag.trim().toLowerCase()
          ),
      );

      return selectedType !== "Tous"
        ? classifiedAds.filter((ad) => (ad.type || "").trim().toLowerCase() === selectedType.trim().toLowerCase())
        : classifiedAds;
    }

    return priceFiltered.filter((ad) => ad.sourceKind === "classified");
  }, [
    activeCategoryFilter,
    classifiedJobBlendEnabled,
    filteredAdsByLocation,
    maxPriceValue,
    minPriceValue,
    hasActivePriceFilter,
    normalizedPriceCurrency,
    normalizedSearchQuery,
    priceCurrency,
    selectedProductTag,
    selectedType,
    selectedTypeTargetsJobs,
    shouldMergeJobsIntoSelectedCategory,
  ]);
  const shouldUseQuickCreateDropdown = selectedCategory === "Tous";
  const shouldCreateJobOffer = !shouldUseQuickCreateDropdown && selectedTypeTargetsJobs;
  const effectivePagination = useMemo(() => {
    if (!classifiedJobBlendEnabled) {
      return listingsPagination;
    }

    const total = allDisplayAds.length;
    const perPage = 30;
    return {
      page: currentPage,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }, [allDisplayAds.length, classifiedJobBlendEnabled, currentPage, listingsPagination]);
  const visibleAds = useMemo(() => {
    if (!classifiedJobBlendEnabled) {
      return allDisplayAds;
    }

    const start = (currentPage - 1) * effectivePagination.perPage;
    return allDisplayAds.slice(start, start + effectivePagination.perPage);
  }, [allDisplayAds, classifiedJobBlendEnabled, currentPage, effectivePagination.perPage]);
  const visibleFeedItems = useMemo(() => injectInlinePublicAds(visibleAds, inlineAds), [inlineAds, visibleAds]);
  const displayedFeedItems = useMemo(
    () =>
      (viewMode === "list" ? visibleFeedItems.slice(0, listVisibleCount) : visibleFeedItems).map((entry) => {
        if (!entry || entry.kind !== "listing") {
          return entry;
        }

        if (entry.item.sourceKind !== "classified") {
          return entry;
        }

        const ownerWpUserId = Number(entry.item.ownerWpUserId || 0);
        return {
          ...entry,
          item: {
            ...entry.item,
            ownerPlanId: ownerWpUserId > 0 ? ownerPlanMap[ownerWpUserId] : undefined,
          },
        };
      }),
    [listVisibleCount, ownerPlanMap, viewMode, visibleFeedItems],
  );
  const hasMoreListItems = viewMode === "list" && listVisibleCount < visibleFeedItems.length;

  useEffect(() => {
    let cancelled = false;

    const loadInlineAds = async () => {
      const requestedFeatures =
        classifiedJobBlendEnabled && selectedTypeTargetsJobs && !hasActivePriceFilter
          ? ["job"]
          : ["classified"];

      try {
        const responses = await Promise.all(
          requestedFeatures.map(async (feature) => {
            const response = await fetch(`/api/public/ads?placement=inline_list&feature=${feature}`, {
              cache: "no-store",
            });
            const payload = await response.json().catch(() => null);
            return response.ok && Array.isArray(payload?.items) ? payload.items : [];
          }),
        );

        if (cancelled) {
          return;
        }

        const merged = Array.from(new Map(responses.flat().map((ad) => [ad.id, ad])).values());
        setInlineAds(merged);
      } catch {
        if (!cancelled) {
          setInlineAds([]);
        }
      }
    };

    void loadInlineAds();
    return () => {
      cancelled = true;
    };
  }, [classifiedJobBlendEnabled, hasActivePriceFilter, selectedTypeTargetsJobs]);

  useEffect(() => {
    if (!selectedAd?.category.trim()) {
      setRelatedAds([]);
      return;
    }

    setRelatedAds([]);
    let cancelled = false;
    const kind = selectedAd.sourceKind === "job" ? "job" : "classified";
    const query = new URLSearchParams({ category: selectedAd.category, perPage: "7" });

    void fetch(`/api/public/listings/${kind}?${query.toString()}`, { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (cancelled || !response.ok || !Array.isArray(payload?.items)) {
          return;
        }
        const mapListing = kind === "job" ? mapJobListingToAd : mapClassifiedListingToAd;
        setRelatedAds(payload.items.map(mapListing).filter((ad: AdData) => ad.id !== selectedAd.id).slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) {
          setRelatedAds([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAd?.category, selectedAd?.id, selectedAd?.sourceKind]);
  const selectedAdGalleryImages = useMemo(
    () =>
      selectedAd
        ? Array.from(new Set([...(selectedAd.images || []), selectedAd.image].filter(Boolean))).slice(0, 10)
        : [],
    [selectedAd],
  );
  const selectedAdDetailHtml = useMemo(() => {
    if (!selectedAd || typeof DOMParser === "undefined") {
      return "";
    }

    return sanitizeListingHtml(selectedAd.content || selectedAd.description || "");
  }, [selectedAd]);
  const selectedAdDetailText = useMemo(
    () => extractPlainTextFromListingHtml(selectedAd?.content || selectedAd?.description || ""),
    [selectedAd?.content, selectedAd?.description],
  );

  const syncSelectedAdFromUrl = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const slugSegment = window.location.pathname.replace(/\/+$/, "").split("/").pop() || "";
    const itemId = extractListingIdFromSlug(slugSegment);
    const matchedAd = allDisplayAds.find((ad) => ad.id === itemId) ?? null;
    setSelectedAd(matchedAd);
  }, [allDisplayAds]);

  const updateItemUrl = (itemId?: number) => {
    if (typeof window === "undefined") {
      return;
    }

    const targetAd = itemId ? allDisplayAds.find((ad) => ad.id === itemId) : null;
    const searchSuffix = currentPublicListSearchSuffix();
    const nextUrl = targetAd
      ? `${buildAdDetailPath(targetAd)}${searchSuffix}`
      : `/petites-annonces${searchSuffix}`;
    window.history.pushState({}, "", nextUrl);
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
    updatePublicListPageUrl(1, true);
  };

  const syncFiltersFromUrl = useCallback(() => {
    isSyncingFiltersFromUrlRef.current = true;
    setSelectedCategory(readPublicListStringParamFromUrl("category", "Tous") || "Tous");
    setSelectedType(readPublicListStringParamFromUrl("type", "Tous") || "Tous");
    setSelectedProductTag(readPublicListStringParamFromUrl("tag", "Tous") || "Tous");
    setSelectedCity(readPublicListStringParamFromUrl("city", "Toutes") || "Toutes");
    setSelectedArea(readPublicListStringParamFromUrl("area", "Toutes") || "Toutes");
    setPriceMin(readPublicListStringParamFromUrl("priceMin", ""));
    setPriceMax(readPublicListStringParamFromUrl("priceMax", ""));
    setPriceCurrency(readPublicListStringParamFromUrl("currency", "Toutes") || "Toutes");
    setSearchQuery(readPublicListStringParamFromUrl("search", ""));
    setDebouncedSearchQuery(readPublicListStringParamFromUrl("search", ""));

    const nextOwnerFilter = readPublicListNumberParamFromUrl("ownerWpUserId", 0);
    setOwnerFilter(Number.isFinite(nextOwnerFilter) && nextOwnerFilter > 0 ? nextOwnerFilter : 0);
    setOwnerFilterLabel(readPublicListStringParamFromUrl("company", ""));
    window.setTimeout(() => {
      isSyncingFiltersFromUrlRef.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    setCurrentPage(readPublicListPageFromUrl());
    syncFiltersFromUrl();
  }, [searchParams, syncFiltersFromUrl]);

  const clearOwnerFilter = useCallback(() => {
    setOwnerFilter(0);
    setOwnerFilterLabel("");
    setCurrentPage(1);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("ownerWpUserId");
      url.searchParams.delete("company");
      url.searchParams.delete("page");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      selectedCategory !== "Tous" ||
      selectedType !== "Tous" ||
      selectedProductTag !== "Tous" ||
      selectedCity !== "Toutes" ||
      selectedArea !== "Toutes" ||
      priceMin.trim().length > 0 ||
      priceMax.trim().length > 0 ||
      priceCurrency !== "Toutes" ||
      ownerFilter > 0 ||
      searchQuery.trim().length > 0,
    [
      ownerFilter,
      priceCurrency,
      priceMax,
      priceMin,
      searchQuery,
      selectedArea,
      selectedCategory,
      selectedCity,
      selectedProductTag,
      selectedType,
    ],
  );

  const resetActiveFilters = useCallback(() => {
    setSelectedCategory("Tous");
    setSelectedType("Tous");
    setSelectedProductTag("Tous");
    setSelectedCity("Toutes");
    setSelectedArea("Toutes");
    setLocationSearch("");
    setPriceMin("");
    setPriceMax("");
    setPriceCurrency("Toutes");
    setOwnerFilter(0);
    setOwnerFilterLabel("");
    setSearchQuery("");
    setDebouncedSearchQuery("");
    resetToFirstPage();
  }, []);

  const applyOwnerFilter = useCallback((ad: AdData) => {
    const nextOwnerFilter = Number(ad.ownerWpUserId || 0);
    const nextOwnerLabel = String(ad.seller || "").trim();
    if (nextOwnerFilter <= 0) {
      return;
    }

    setOwnerFilter(nextOwnerFilter);
    setOwnerFilterLabel(nextOwnerLabel);
    setCurrentPage(1);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("ownerWpUserId", String(nextOwnerFilter));
      if (nextOwnerLabel) {
        url.searchParams.set("company", nextOwnerLabel);
      } else {
        url.searchParams.delete("company");
      }
      url.searchParams.delete("page");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const applyCategoryFilter = useCallback((category: string) => {
    const nextCategory = String(category || "").trim();
    if (!nextCategory) {
      return;
    }

    setSelectedCategory(nextCategory);
    setSelectedType("Tous");
    resetToFirstPage();
  }, []);

  const handlePageChange = (page: number) => {
    const safeTotalPages = Math.max(effectivePagination.totalPages || 1, 1);
    const nextPage = Math.min(Math.max(page, 1), safeTotalPages);
    if (nextPage === currentPage) {
      return;
    }
    setCurrentPage(nextPage);
    updatePublicListPageUrl(nextPage);
  };

  const openAd = (ad: AdData) => {
    setInteractionError("");
    setSelectedAd(ad);
    setIsModalContactVisible(false);
    const galleryImages = Array.from(new Set([...(ad.images || []), ad.image].filter(Boolean))).slice(0, 10);
    updateItemUrl(ad.id);
  };

  const closeAd = () => {
    setSelectedAd(null);
    setIsModalContactVisible(false);
    setIsModalSaved(false);
    setIsModalSaveReady(false);
    setInteractionError("");
    updateItemUrl();
  };

  useEffect(() => {
    let cancelled = false;

    const fetchSavedState = async () => {
      if (!selectedAd) return;
      setIsModalSaveReady(false);
      try {
        const response = await fetch(`/api/saved-items?kind=${selectedAd.sourceKind}&itemId=${selectedAd.id}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        if (response.ok) {
          setIsModalSaved(Boolean(payload?.saved));
        } else {
          setIsModalSaved(false);
        }
      } catch {
        if (!cancelled) {
          setIsModalSaved(false);
        }
      } finally {
        if (!cancelled) {
          setIsModalSaveReady(true);
        }
      }
    };

    void fetchSavedState();

    return () => {
      cancelled = true;
    };
  }, [selectedAd]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuickSavedState() {
      if (!isLoggedIn || visibleAds.length === 0) {
        if (!cancelled) {
          setQuickSavedState({});
        }
        return;
      }

      try {
        const ads = visibleAds.slice(0, 50);
        const response = await fetch(`/api/saved-items?keys=${encodeURIComponent(ads.map((ad) => `${ad.sourceKind}:${ad.id}`).join(","))}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        const savedKeys = new Set<string>(response.ok && Array.isArray(payload?.savedKeys) ? payload.savedKeys : []);

        if (!cancelled) {
          setQuickSavedState(Object.fromEntries(ads.map((ad) => [getAdQuickKey(ad), savedKeys.has(`${ad.sourceKind}:${ad.id}`)])));
        }
      } catch {
        if (!cancelled) {
          setQuickSavedState({});
        }
      }
    }

    void loadQuickSavedState();

    return () => {
      cancelled = true;
    };
  }, [getAdQuickKey, isLoggedIn, visibleAds]);

  async function handleToggleModalSave() {
    if (!selectedAd || isModalSaving || !isModalSaveReady) return;
    if (isEmailVerificationRequired) {
      setInteractionError("Vérification email requise pour enregistrer une annonce.");
      return;
    }
    setIsModalSaving(true);
    try {
      const response = await fetch("/api/saved-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            action: "toggle",
            item: {
            kind: selectedAd.sourceKind,
            itemId: String(selectedAd.id),
            slug: buildListingSlug(selectedAd.id, selectedAd.title, selectedAd.sourceKind === "job" ? "offre" : "annonce"),
            title: selectedAd.title,
            description: selectedAd.description,
            image: selectedAd.image,
            location: selectedAd.location,
            price: selectedAd.price,
            sourceLabel: selectedAd.seller,
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (response.ok) {
        setIsModalSaved(Boolean(payload?.saved));
      }
    } finally {
      setIsModalSaving(false);
    }
  }

  async function handleQuickToggleSave(ad: AdData) {
    const quickKey = getAdQuickKey(ad);
    if (!isLoggedIn || quickSavingKey === quickKey) {
      return;
    }

    if (isEmailVerificationRequired) {
      setShowLoginModal(true);
      return;
    }

    setQuickSavingKey(quickKey);
    try {
      const response = await fetch("/api/saved-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggle",
          item: {
            kind: ad.sourceKind,
            itemId: String(ad.id),
            slug: buildListingSlug(ad.id, ad.title, ad.sourceKind === "job" ? "offre" : "annonce"),
            title: ad.title,
            description: ad.description,
            image: ad.image,
            location: ad.location,
            price: ad.price,
            sourceLabel: ad.seller,
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (response.ok) {
        setQuickSavedState((current) => ({
          ...current,
          [quickKey]: Boolean(payload?.saved),
        }));
      }
    } finally {
      setQuickSavingKey(null);
    }
  }

  async function handleQuickShare(ad: AdData) {
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}${buildAdDetailPath(ad)}` : buildAdDetailPath(ad);
    setShareTarget({ title: ad.title, url: shareUrl, text: ad.title });
    setIsShareModalOpen(true);
  }

  const selectedAdShareUrl =
    typeof window !== "undefined" && selectedAd
      ? `${window.location.origin}${buildAdDetailPath(selectedAd)}`
      : "";

  useEffect(() => {
    let cancelled = false;

    const fetchFeatured = async () => {
      try {
        const requests = classifiedJobBlendEnabled
          ? [
              fetch("/api/public/listings/classified?perPage=50&featured=true", { cache: "no-store" }),
              fetch("/api/public/listings/job?perPage=50&featured=true", { cache: "no-store" }),
            ]
          : [
              fetch("/api/public/listings/classified?perPage=50&featured=true", { cache: "no-store" }),
            ];

        const responses = await Promise.all(requests);

        const payloads = await Promise.all(responses.map((response) => response.json().catch(() => null)));

        if (!cancelled) {
          if (classifiedJobBlendEnabled) {
            const [classifiedListingsRes, jobListingsRes] = responses;
            const [classifiedListingsPayload, jobListingsPayload] = payloads;

            if (classifiedListingsRes.ok && Array.isArray(classifiedListingsPayload?.items) && jobListingsRes.ok && Array.isArray(jobListingsPayload?.items)) {
              setFeaturedAdsSource(
                sortAdsByDateDescending([
                  ...classifiedListingsPayload.items.map(mapClassifiedListingToAd),
                  ...jobListingsPayload.items.map(mapJobListingToAd),
                ]),
              );
            }

          } else {
            const [listingsRes] = responses;
            const [listingsPayload] = payloads;

            if (listingsRes.ok && Array.isArray(listingsPayload?.items)) {
              setFeaturedAdsSource(listingsPayload.items.map(mapClassifiedListingToAd));
            } else if (!listingsRes.ok) {
              console.error("[petites-annonces] /api/public/listings/classified failed", listingsPayload);
            }

          }
        }
      } catch (error) {
        console.error("[petites-annonces] Impossible de charger les annonces mises en avant.", error);
        return;
      }
    };

    fetchFeatured();
    return () => {
      cancelled = true;
    };
  }, [classifiedJobBlendEnabled]);

  useEffect(() => {
    let cancelled = false;

    const fetchRemote = async () => {
      setRemoteFetchState("loading");
      try {
        if (classifiedJobBlendEnabled) {
          const [classifiedRes, jobRes] = await Promise.all([
            fetch("/api/public/listings/classified?perPage=120", { cache: "no-store" }),
            fetch("/api/public/listings/job?perPage=120", { cache: "no-store" }),
          ]);
          const [classifiedPayload, jobPayload] = await Promise.all([
            classifiedRes.json().catch(() => null),
            jobRes.json().catch(() => null),
          ]);

          if (cancelled) {
            return;
          }

          if (classifiedRes.ok && Array.isArray(classifiedPayload?.items) && jobRes.ok && Array.isArray(jobPayload?.items)) {
            const mergedAds = sortAdsByDateDescending([
              ...classifiedPayload.items.map(mapClassifiedListingToAd),
              ...jobPayload.items.map(mapJobListingToAd),
            ]);

            setRemoteAds(mergedAds);
            setListingsPagination({
              page: currentPage,
              perPage: 30,
              total: mergedAds.length,
              totalPages: Math.max(1, Math.ceil(mergedAds.length / 30)),
            });
            setRemoteFetchState("ready");
          } else {
            setRemoteAds([]);
            setListingsPagination((current) => ({ ...current, total: 0, totalPages: 1 }));
            setRemoteFetchState("error");
          }
        } else {
          const query = new URLSearchParams({
            perPage: "30",
            page: String(currentPage),
          });

          if (normalizedSearchQuery) {
            query.set("search", normalizedSearchQuery);
          }

          if (activeCategoryFilter) {
            query.set("category", selectedCategory !== "Tous" ? selectedCategory : activeCategoryFilter);
          }

          if (selectedType !== "Tous") {
            query.set("type", selectedType);
          }

          if (selectedProductTag !== "Tous") {
            query.set("productTag", selectedProductTag);
          }

          if (selectedCity !== "Toutes") {
            query.set("city", selectedCity);
          }

          if (selectedArea !== "Toutes") {
            query.set("area", selectedArea);
          }

          if (ownerFilter > 0) {
            query.set("ownerWpUserId", String(ownerFilter));
          }

          if (minPriceValue !== null) {
            query.set("priceMin", String(minPriceValue));
          }

          if (maxPriceValue !== null) {
            query.set("priceMax", String(maxPriceValue));
          }

          if (normalizedPriceCurrency !== "TOUTES") {
            query.set("currency", normalizedPriceCurrency);
          }

          const listingsRes = await fetch(`/api/public/listings/classified?${query.toString()}`, { cache: "no-store" });
          const listingsPayload = await listingsRes.json().catch(() => null);

          if (cancelled) {
            return;
          }

          if (listingsRes.ok && Array.isArray(listingsPayload?.items)) {
            const totalPages = Math.max(Number(listingsPayload?.pagination?.totalPages || 1), 1);
            if (currentPage > totalPages) {
              setCurrentPage(totalPages);
              updatePublicListPageUrl(totalPages, true);
              return;
            }

            const mappedAds = listingsPayload.items.map(mapClassifiedListingToAd);
            setRemoteAds(mappedAds);
            setListingsPagination({
              page: Number(listingsPayload?.pagination?.page || currentPage),
              perPage: Number(listingsPayload?.pagination?.perPage || 30),
              total: Number(listingsPayload?.pagination?.total || 0),
              totalPages,
            });
            setRemoteFetchState("ready");
          } else {
            setRemoteAds([]);
            setListingsPagination((current) => ({ ...current, total: 0, totalPages: 1 }));
            setRemoteFetchState("error");
            console.error("[petites-annonces] /api/public/listings/classified failed", listingsPayload);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setRemoteAds([]);
          setListingsPagination((current) => ({ ...current, total: 0, totalPages: 1 }));
          setRemoteFetchState("error");
        }
        console.error("[petites-annonces] Impossible de charger les annonces dynamiques.", error);
      } finally {
        if (!cancelled) {
          setHasResolvedInitialListings(true);
        }
      }
    };

    fetchRemote();

    return () => {
      cancelled = true;
    };
  }, [
    activeCategoryFilter,
    classifiedJobBlendEnabled,
    currentPage,
    maxPriceValue,
    minPriceValue,
    normalizedPriceCurrency,
    normalizedSearchQuery,
    ownerFilter,
    selectedArea,
    selectedCity,
    selectedProductTag,
    selectedType,
  ]);

  useEffect(() => {
    setListVisibleCount(10);
    if (viewMode === "list" && currentPage !== 1 && !classifiedJobBlendEnabled) {
      setCurrentPage(1);
      updatePublicListPageUrl(1, true);
    }
  }, [
    activeCategoryFilter,
    classifiedJobBlendEnabled,
    normalizedSearchQuery,
    ownerFilter,
    priceCurrency,
    selectedArea,
    selectedCategory,
    selectedCity,
    selectedProductTag,
    selectedType,
    viewMode,
  ]);

  useEffect(() => {
    if (viewMode !== "list") {
      return;
    }

    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || remoteFetchState === "loading") {
          return;
        }

        if (typeof window !== "undefined" && window.scrollY < 120) {
          return;
        }

        if (listVisibleCount < visibleFeedItems.length) {
          setListVisibleCount((current) => Math.min(current + 10, visibleFeedItems.length));
          return;
        }

      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [
    classifiedJobBlendEnabled,
    currentPage,
    listVisibleCount,
    listingsPagination.totalPages,
    remoteFetchState,
    viewMode,
    visibleFeedItems.length,
  ]);

  useEffect(() => {
    updatePublicListQueryParams({
      search: searchQuery,
      category: selectedCategory !== "Tous" ? selectedCategory : null,
      type: selectedType !== "Tous" ? selectedType : null,
      tag: selectedProductTag !== "Tous" ? selectedProductTag : null,
      city: selectedCity !== "Toutes" ? selectedCity : null,
      area: selectedArea !== "Toutes" ? selectedArea : null,
      priceMin,
      priceMax,
      currency: priceCurrency !== "Toutes" ? priceCurrency : null,
      ownerWpUserId: ownerFilter > 0 ? ownerFilter : null,
      company: ownerFilter > 0 ? ownerFilterLabel : null,
    });
  }, [
    ownerFilter,
    ownerFilterLabel,
    priceCurrency,
    priceMax,
    priceMin,
    searchQuery,
    selectedArea,
    selectedCategory,
    selectedCity,
    selectedProductTag,
    selectedType,
  ]);

  useEffect(() => {
    syncSelectedAdFromUrl();

    const handlePopState = () => {
      setCurrentPage(readPublicListPageFromUrl());
      syncFiltersFromUrl();
      syncSelectedAdFromUrl();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [syncFiltersFromUrl, syncSelectedAdFromUrl]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedAd) {
        closeAd();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedAd]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (selectedAd) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedAd]);

  return (
    <div className="public-listing-page relative w-full min-h-screen bg-white pb-[50px] font-['Roboto_Flex',sans-serif] text-[#111111] dark:bg-[var(--page-bg)] dark:text-white">
      <div className="content-stretch mx-auto flex w-full max-w-[1440px] flex-col items-center px-4 sm:px-6 lg:px-8">
        <header className="tanyora-catalogue-intro">
          <div>
            <span className="tanyora-catalogue-index">TANYORA / COLLECTION 01</span>
            <h1>Le marché des découvertes</h1>
          </div>
          <p>Des pièces singulières, proposées par celles et ceux qui les connaissent.</p>
        </header>
        {sponsoredAds.length > 0 ? (
          <div className="content-stretch relative flex w-full shrink-0 flex-col items-end gap-[16px] pt-[20px]">
            <div
              className="inline-flex shrink-0 items-center justify-center self-end rounded-[12px] border border-[#27624f] bg-[#fff1f2] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#27624f]"
              style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}
            >
              SPONSORISÉES
            </div>

            <SponsoredSlider
              leading={<FeaturedCard isBlended={classifiedJobBlendEnabled} />}
              leadingClassName="hidden lg:block"
              items={sponsoredAds}
              renderItem={(ad) =>
                ad.sourceKind === "job" ? (
                  <SmallJobAdCard key={`sponsored-${ad.sourceKind}-${ad.id}`} ad={ad} onClick={() => openAd(ad)} />
                ) : (
                  <ClassifiedRelatedCard key={`sponsored-${ad.sourceKind}-${ad.id}`} item={ad} onClick={() => openAd(ad)} />
                )
              }
            />
          </div>
        ) : null}

        <PublicAdBannerRow placement="boost_list" />

        {/* Main Content: Sidebar + Ad List */}
        <div className="content-stretch relative flex w-full shrink-0 flex-col items-start gap-[14px] pt-[32px] lg:flex-row">
          
          {/* Sidebar Filters */}
          <div className={`${isDesktopFilters || isMobileFiltersVisible ? "flex" : "hidden"} listing-filter-panel tanyora-marketplace-filters content-stretch relative w-full shrink-0 flex-col items-start lg:flex lg:w-[264px] prototype-listing-sidebar`}>
            <div className="relative w-full">
              <div aria-hidden="true" className="absolute border-[#e8e8e8] dark:border-[#3a3a3a] border-r border-solid inset-0 pointer-events-none rounded-[12px]" />
              <header className="tanyora-filter-heading hidden lg:flex">
                <strong>Filtres</strong>
                {hasActiveFilters ? <button type="button" onClick={resetActiveFilters}>Tout effacer</button> : null}
              </header>
              <div className="content-stretch flex flex-col items-start relative w-full">
                {!isDesktopFilters ? (
                  <div className="flex w-full items-center justify-between border-b border-[#e8e8e8] px-[12px] py-[12px] dark:border-[#3a3a3a] lg:hidden">
                    <p className="text-[12px] font-bold text-[#191919] dark:text-white">Filtres</p>
                    {hasActiveFilters ? <button type="button" onClick={resetActiveFilters} className="tanyora-filter-reset">Tout effacer</button> : null}
                    <button
                      type="button"
                      onClick={() => setIsMobileFiltersVisible(false)}
                      className="rounded-full border border-[#d8d8dc] px-3 py-1 text-[11px] font-semibold text-[#191919] dark:border-[#4a4a52] dark:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                ) : null}
                <PublicListingTextFilter
                  title="Recherche"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Recherche"
                />
                <PublicListingCategoryFilter
                  title={"Catégories"}
                  isOpen={isCategoriesOpen}
                  isDesktopFilters={isDesktopFilters}
                  selectedParent={selectedCategory}
                  selectedChild={selectedType}
                  expandedParent={expandedCategory}
                  items={categoryNodes}
                  onToggleSection={() => toggleFilterAccordion("categories")}
                  onToggleParent={(value) =>
                    setExpandedCategory((current) => (current === value ? null : value))
                  }
                  onSelectAll={() => {
                    setSelectedCategory("Tous");
                    setSelectedType("Tous");
                    resetToFirstPage();
                  }}
                  onSelectParent={(value) => {
                    if (value === "Emploi") {
                      router.push("/offres-emploi");
                      return;
                    }

                    setSelectedCategory(value);
                    setSelectedType("Tous");
                    resetToFirstPage();
                  }}
                  onSelectChild={(parentValue, childValue) => {
                    setSelectedCategory(parentValue);
                    setSelectedType(childValue);
                    setExpandedCategory(parentValue);
                    resetToFirstPage();
                  }}
                />

                <PublicListingLocationFilter
                  title="Villes et zones"
                  searchValue={locationSearch}
                  onSearchChange={setLocationSearch}
                  selectedParent={selectedCity}
                  selectedChild={selectedArea}
                  expandedParent={expandedLocationCity}
                  items={locationNodes}
                  onToggleParent={(value) =>
                    setExpandedLocationCity((current) => (current === value ? null : value))
                  }
                  onSelectAll={() => {
                    setSelectedCity("Toutes");
                    setSelectedArea("Toutes");
                    resetToFirstPage();
                  }}
                  onSelectParent={(value) => {
                    setSelectedCity(value);
                    setSelectedArea("Toutes");
                    resetToFirstPage();
                  }}
                  onSelectChild={(parentValue, childValue) => {
                    setSelectedCity(parentValue);
                    setSelectedArea(childValue);
                    setExpandedLocationCity(parentValue);
                    resetToFirstPage();
                  }}
                />

                <div className="tanyora-price-filter relative mt-3 w-full border-t border-solid border-[#e8e8e8] pt-3 dark:border-[#3a3a3a]">
                  <div className="flex w-full flex-col items-start px-[10px] pb-[12px] pt-[2px]">
                    <div className="flex w-full items-center">
                      <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] text-[12px] font-bold leading-[1.2] text-[#191919] dark:text-white">
                        <p className="leading-[1.2]">Fourchette de prix</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] leading-[1.45] text-[#7a7a82] dark:text-[#8a8a94]">
                      {selectedTypeTargetsJobs
                        ? "Ce filtre est désactivé pour les offres d'emploi."
                        : "Ce filtre s'applique uniquement aux petites annonces."}
                    </p>
                    <div className="mt-3 grid w-full grid-cols-1 gap-2">
                      <div className="public-listing-filter-control ui-border-strong ui-surface ui-text-main flex h-[40px] items-center rounded-[12px] border px-3">
                        <input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={priceMin}
                          disabled={selectedTypeTargetsJobs}
                          onChange={(event) => setPriceMin(event.target.value)}
                          placeholder="Minimum"
                          className="h-full w-full bg-transparent text-[12px] outline-none placeholder:text-[#8c8c93] disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-[#8a8a94]"
                        />
                      </div>
                      <div className="public-listing-filter-control ui-border-strong ui-surface ui-text-main flex h-[40px] items-center rounded-[12px] border px-3">
                        <input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={priceMax}
                          disabled={selectedTypeTargetsJobs}
                          onChange={(event) => setPriceMax(event.target.value)}
                          placeholder="Maximum"
                          className="h-full w-full bg-transparent text-[12px] outline-none placeholder:text-[#8c8c93] disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-[#8a8a94]"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex w-full gap-2">
                      <div className="public-listing-filter-control ui-border-strong ui-surface ui-text-main flex h-[40px] min-w-0 flex-1 items-center rounded-[12px] border px-3">
                        <select
                          value={priceCurrency}
                          disabled={selectedTypeTargetsJobs}
                          onChange={(event) => setPriceCurrency(event.target.value)}
                          className="h-full w-full appearance-none border-0 bg-transparent text-[12px] outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {availablePriceCurrencies.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency === "Toutes" ? "Toutes les devises" : currency}
                            </option>
                          ))}
                        </select>
                      </div>
                      {(priceMin || priceMax || priceCurrency !== "Toutes") ? (
                        <button
                          type="button"
                          disabled={selectedTypeTargetsJobs}
                          onClick={() => {
                            setPriceMin("");
                            setPriceMax("");
                            setPriceCurrency("Toutes");
                            resetToFirstPage();
                          }}
                          className="rounded-[12px] border border-[#d8d8dc] px-3 text-[11px] font-semibold text-[#191919] transition-colors hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#4a4a52] dark:text-white"
                        >
                          Effacer
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ad List Section */}
          <div ref={resultsScrollRef} className="listing-results-panel content-stretch relative flex min-w-0 flex-1 flex-col items-start gap-[18px] self-stretch">
            
            {/* Results Header */}
            <div className="listing-results-toolbar content-stretch relative flex w-full min-w-0 shrink-0 flex-col items-start justify-between gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              {!isDesktopFilters ? (
                <div className="w-full lg:hidden">
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersVisible((current) => !current)}
                    className="ui-surface ui-border ui-text-main inline-flex items-center gap-2 rounded-[12px] border px-4 py-2 text-[12px] font-semibold"
                  >
                    {isMobileFiltersVisible ? "Masquer les filtres" : "Afficher les filtres"}
                  </button>
                </div>
              ) : null}
              <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[1.4] not-italic relative shrink-0 text-[#191919] dark:text-white text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p>
                  <span className="font-semibold">RESULTATS </span>
                  <span className="font-normal">({effectivePagination.total})</span>
                </p>
              </div>

              <div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end lg:flex-1">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetActiveFilters}
                    className="ui-text-main inline-flex items-center justify-center self-start rounded-full border border-[#d8d8dc] px-3 py-2 text-[11px] font-semibold transition-colors hover:border-[#27624f] hover:text-[#27624f] dark:border-[#4a4a52] sm:self-auto"
                  >
                    Réinitialiser les filtres
                  </button>
                ) : null}

                {isLoggedIn ? (
                  <PublicListQuickCreateButton
                    href={shouldCreateJobOffer ? "/profil/offres-emploi" : "/profil/petites-annonces"}
                    label={shouldCreateJobOffer ? "Créer une offre" : "Créer une annonce"}
                    dropdownMode={shouldUseQuickCreateDropdown}
                  />
                ) : null}

                <PublicListingViewToggle value={viewMode} onChange={setViewMode} className="self-end sm:self-auto" />
              </div>
            </div>

            {activeOwnerDisplay ? (
              <div className="flex w-full flex-wrap items-center gap-2">
                <div className="ui-surface ui-border ui-text-main inline-flex items-center gap-2 rounded-full border px-2 py-1.5 text-[12px] font-medium">
                  {activeOwnerDisplay.image ? (
                    <AppImage
                      alt={activeOwnerDisplay.name}
                      src={activeOwnerDisplay.image}
                      className="h-6 w-6 rounded-full object-cover"
                      eager
                    />
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#27624f] text-[10px] font-bold text-white">
                      {activeOwnerDisplay.initial}
                    </span>
                  )}
                  <span>
                    Filtre annonceur actif : {activeOwnerDisplay.name}
                  </span>
                  <button
                    type="button"
                    onClick={clearOwnerFilter}
                    aria-label="Retirer le filtre annonceur"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/5 text-[12px] transition hover:bg-[#27624f] hover:text-white dark:bg-white/10"
                  >×</button>
                </div>
              </div>
            ) : null}

            {displayProductTags.length > 0 ? (
              <div className="flex w-full flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedProductTag("Tous");
                    resetToFirstPage();
                  }}
                  className={clsx(
                    "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                    selectedProductTag === "Tous"
                      ? "border-[#27624f] bg-[#27624f] text-white"
                      : "ui-border ui-surface ui-text-main hover:border-[#27624f] hover:text-[#27624f]",
                  )}
                >
                  Tous
                </button>
                {displayProductTags.map((productTag) => {
                  const isActive = selectedProductTag === productTag;
                  return (
                    <button
                      key={productTag}
                      onClick={() => {
                        setSelectedProductTag(productTag);
                        resetToFirstPage();
                      }}
                      className={clsx(
                        "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                        isActive
                          ? "border-[#27624f] bg-[#27624f] text-white"
                          : "ui-border ui-surface ui-text-main hover:border-[#27624f] hover:text-[#27624f]",
                      )}
                    >
                      {productTag}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <PublicListingCollection
              viewMode={viewMode}
              isLoading={isListingsLoading}
              items={displayedFeedItems}
              renderGridItem={(entry) =>
                entry.kind === "advertisement" ? (
                  <InlinePublicListingAdCard
                    key={`ad-inline-grid-${entry.item.id}`}
                    ad={entry.item}
                    feature={entry.item.feature === "job" ? "job" : "classified"}
                    viewMode="grid"
                  />
                ) : entry.item.sourceKind === "job" ? (
                  <JobLikeAdCard key={`${entry.item.sourceKind}-${entry.item.id}`} ad={entry.item} onClick={() => openAd(entry.item)} />
                ) : (
                  <AdCard key={`${entry.item.sourceKind}-${entry.item.id}`} ad={entry.item} onClick={() => openAd(entry.item)} />
                )
              }
              renderListItem={(entry) =>
                entry.kind === "advertisement" ? (
                  <InlinePublicListingAdCard
                    key={`ad-inline-list-${entry.item.id}`}
                    ad={entry.item}
                    feature={entry.item.feature === "job" ? "job" : "classified"}
                    viewMode="list"
                  />
                ) : entry.item.sourceKind === "job" ? (
                  <JobLikeAdListCard
                    key={`${entry.item.sourceKind}-${entry.item.id}`}
                    ad={entry.item}
                    onClick={() => openAd(entry.item)}
                    canSave={isLoggedIn}
                    isSaved={Boolean(quickSavedState[getAdQuickKey(entry.item)])}
                    isSaving={quickSavingKey === getAdQuickKey(entry.item)}
                    onToggleSave={() => {
                      void handleQuickToggleSave(entry.item);
                    }}
                    onShare={() => {
                      void handleQuickShare(entry.item);
                    }}
                    contactHref={hasPaidContactAccess && !isEmailVerificationRequired ? `${buildAdDetailPath(entry.item)}/contacter` : null}
                  />
                ) : (
                  <AdListCard
                    key={`${entry.item.sourceKind}-${entry.item.id}`}
                    ad={entry.item}
                    onClick={() => openAd(entry.item)}
                    onSellerClick={applyOwnerFilter}
                    onCategoryClick={applyCategoryFilter}
                    canSave={isLoggedIn}
                    isSaved={Boolean(quickSavedState[getAdQuickKey(entry.item)])}
                    isSaving={quickSavingKey === getAdQuickKey(entry.item)}
                    onToggleSave={() => {
                      void handleQuickToggleSave(entry.item);
                    }}
                    onShare={() => {
                      void handleQuickShare(entry.item);
                    }}
                    contactHref={hasPaidContactAccess && !isEmailVerificationRequired ? `${buildAdDetailPath(entry.item)}/contacter` : null}
                  />
                )
              }
              renderGridSkeleton={(index) => <AdCardSkeleton key={`ad-skeleton-${index}`} />}
              renderListSkeleton={(index) => <AdListCardSkeleton key={`ad-list-skeleton-${index}`} />}
              emptyState={<div className="ui-card-flat mt-4 w-full rounded-xl border px-4 py-3 text-xs">
                {remoteFetchState === "error"
                  ? "Impossible de charger les annonces publiques pour le moment."
                  : normalizedSearchQuery
                    ? "Aucune annonce ne correspond a votre recherche pour le moment."
                    : "Aucune annonce publique disponible pour le moment."}
              </div>}
            />
            <PublicListPagination
              currentPage={currentPage}
              totalPages={effectivePagination.totalPages}
              onPageChange={handlePageChange}
            />
            {viewMode === "list" && hasMoreListItems ? (
              <div ref={loadMoreRef} className="flex w-full items-center justify-center py-6 text-[12px] text-[#707070] dark:text-[#a1a1aa]">
                {remoteFetchState === "loading" ? "Chargement..." : "Faites défiler pour charger plus"}
              </div>
            ) : null}
          </div>

        </div>
      </div>

      {/* Modal */}
      {selectedAd ? (
        <PublicListingDetailPage
          modal
          onClose={closeAd}
          backHref="/petites-annonces"
          backLabel="Retour aux annonces"
          mode={selectedAd.sourceKind === "job" ? "job" : "ad"}
          item={mapAdDataToDetailItem(selectedAd)}
          bottomSimilarItems={relatedAds.map(mapAdDataToDetailItem)}
          isOwner={Boolean(user?.wpUserId && Number(selectedAd.ownerWpUserId || 0) === Number(user.wpUserId))}
          ownerEditHref={selectedAd.sourceKind === "job" ? "/profil/offres-emploi" : "/profil/petites-annonces"}
          sellerListingsHref={
            selectedAd.sourceKind === "job"
              ? selectedAd.ownerWpUserId
                ? `/offres-emploi?ownerWpUserId=${selectedAd.ownerWpUserId}`
                : "/offres-emploi"
              : selectedAd.ownerWpUserId
                ? `/petites-annonces?ownerWpUserId=${selectedAd.ownerWpUserId}`
                : "/petites-annonces"
          }
          renderBottomSimilarItem={(ad) => {
            const listing = ad as AdData;
            return listing.sourceKind === "job" ? (
              <SmallJobAdCard ad={listing} onClick={() => openAd(listing)} />
            ) : (
              <ClassifiedRelatedCard item={listing} onClick={() => openAd(listing)} />
            );
          }}
        />
      ) : null}
      <ShareSheetModal
        open={isShareModalOpen && Boolean(shareTarget)}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareTarget(null);
        }}
        title={shareTarget?.title || "Partager cette annonce"}
        url={shareTarget?.url || selectedAdShareUrl || (typeof window !== "undefined" ? window.location.href : "")}
        text={shareTarget?.text}
      />
    </div>
  );
}
