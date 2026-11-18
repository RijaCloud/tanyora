// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from "next/navigation";
import { AppImage } from "@/components/ui/AppImage";
import clsx from "clsx";
import svgPaths from "@/features/prototype/imports/svg-h6eue3h5ci";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { extractPlainTextFromListingHtml, sanitizeListingHtml } from "@/lib/content/listing-html";
import { formatRelativeTime } from "@/lib/dates/formatRelativeTime";
import { buildListingSlug, extractListingIdFromSlug } from "@/lib/listings/slug";
import {
  currentPublicListSearchSuffix,
  readPublicListPageFromUrl,
  readPublicListStringParamFromUrl,
  updatePublicListPageUrl,
  updatePublicListQueryParams,
} from "@/lib/listings/public-list-page";
import { useScrollResultsIntoView } from "@/lib/hooks/useScrollResultsIntoView";
import { usePublicListingFilterCatalog } from "@/lib/hooks/usePublicListingFilterCatalog";
import PublicListPagination from "@/features/prototype/components/PublicListPagination";
import PublicListQuickCreateButton from "@/features/prototype/components/PublicListQuickCreateButton";
import PublicAdBannerRow from "@/features/prototype/components/PublicAdBannerRow";
import InlinePublicListingAdCard from "@/features/prototype/components/InlinePublicListingAdCard";
import ListingSponsoredBadge from "@/features/prototype/components/ListingSponsoredBadge";
import PublicListingDetailPage from "@/features/prototype/components/PublicListingDetailPage";
import PublicListingCategoryFilter from "@/features/prototype/components/PublicListingCategoryFilter";
import PublicListingLocationFilter from "@/features/prototype/components/PublicListingLocationFilter";
import PublicListingTextFilter from "@/features/prototype/components/PublicListingTextFilter";
import PublicListingCollection, { PublicListingViewToggle, type PublicListingViewMode } from "@/features/prototype/components/PublicListingCollection";
import SponsoredSlider from "@/features/prototype/components/SponsoredSlider";
import { ShareArrowIcon } from "@/components/ui/ShareArrowIcon";
import { ShareSheetModal } from "@/components/ui/ShareSheetModal";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";
import type { PublicAdItem } from "@/lib/api/wordpress-internal";
import { dedupeTaxonomyTermsByHierarchy, type TaxonomyTermResult } from "@/lib/taxonomy/terms";
import { injectInlinePublicAds } from "@/lib/listings/inline-public-ads";

interface TenderData {
  id: number;
  organization: string;
  organizationLetter: string;
  organizationColor: string;
  profilePhoto?: string;
  companyLogo?: string;
  location: string;
  title: string;
  description: string;
  excerpt?: string;
  content?: string;
  budget: string;
  currency?: string;
  date?: string;
  deadline: string;
  detailsPdfUrl?: string;
  detailsPdfName?: string;
  category: string;
  type?: string;
  featured?: boolean;
  isAdminCreated?: boolean;
  contact?: string;
  email?: string;
  expiresAt?: string;
  isExpired?: boolean;
  ownerWpUserId?: number;
  ownerRatingAverage?: number;
  ownerRatingCount?: number;
}

function mapPublicListingToTender(item: any): TenderData {
  return {
    id: Number(item.id),
    organization: item.companyName || "Organisation",
    organizationLetter: String(item.companyName || "O").slice(0, 1).toUpperCase(),
    organizationColor: "#27624f",
    profilePhoto: item.companyLogo || "",
    companyLogo: item.companyLogo || "",
    location: item.location || "Madagascar",
    title: item.title || "Appel d'offres",
    description: extractPlainTextFromListingHtml(item.content || item.description || ""),
    excerpt: extractPlainTextFromListingHtml(item.excerpt || item.description || ""),
    content: item.content || "",
    budget: item.budget || "",
    currency: item.currency || "MGA",
    date: item.date || "",
    deadline: item.deadline || item.date || "",
    detailsPdfUrl: item.detailsPdfUrl || "",
    detailsPdfName: item.detailsPdfName || "",
    category: item.category || "Autres",
    type: item.type || "",
    featured: Boolean(item.featured),
    isAdminCreated: Boolean(item.isAdminCreated),
    contact: item.contactPhone || "",
    email: item.contactEmail || "",
    expiresAt: item.expiresAt || "",
    isExpired: Boolean(item.isExpired),
    ownerWpUserId: Number(item.ownerWpUserId || 0),
    ownerRatingAverage: Number(item.ownerRatingAverage || 0),
    ownerRatingCount: Number(item.ownerRatingCount || 0),
  };
}

function parseDisplayDate(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) {
    return Number.NaN;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (slashMatch) {
    const [, day, month, year, hours = "0", minutes = "0", seconds = "0"] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds)).getTime();
  }

  const dashedMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (dashedMatch) {
    const [, year, month, day, hours = "0", minutes = "0", seconds = "0"] = dashedMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds)).getTime();
  }

  return new Date(raw).getTime();
}

function formatTenderDate(value?: string | null) {
  const timestamp = parseDisplayDate(value);
  if (!Number.isFinite(timestamp)) {
    return String(value || "").trim();
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

function isTenderExpired(tender: Pick<TenderData, "expiresAt" | "isExpired">) {
  if (tender.isExpired) {
    return true;
  }

  const expirationTimestamp = parseDisplayDate(tender.expiresAt);
  if (!Number.isFinite(expirationTimestamp)) {
    return false;
  }

  return expirationTimestamp < Date.now();
}

function sortTendersByMostRecent(items: TenderData[]) {
  return [...items].sort((left, right) => {
    const leftTimestamp = Number.isFinite(parseDisplayDate(left.date)) ? parseDisplayDate(left.date) : 0;
    const rightTimestamp = Number.isFinite(parseDisplayDate(right.date)) ? parseDisplayDate(right.date) : 0;
    return rightTimestamp - leftTimestamp;
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

function Union() {
  return (
    <div className="relative shrink-0 size-[15px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <path d={svgPaths.p1d0f4800} fill="var(--fill-0, #27624f)" id="Union" />
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[6.93%_0_6.92%_0]">
      <div className="absolute inset-[6.93%_0_6.92%_0]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.00007 11.1998">
          <path d={svgPaths.p133f400} fill="var(--fill-0, #737373)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

type LogoTextProps = {
  text: string;
  bg: string;
  imageSrc?: string;
  alt?: string;
};

function LogoText({ text, bg, imageSrc, alt = "" }: LogoTextProps) {
  return (
    <div className="relative flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]" style={{ backgroundColor: bg }}>
      {imageSrc ? <AppImage alt={alt} className="h-full w-full object-cover" src={imageSrc} eager /> : <span className="text-[13px] font-bold leading-none text-white">{text}</span>}
    </div>
  );
}

// Featured "Appels d'offre" card
function FeaturedCard() {
  return (
    <div className="relative h-[216px] w-[min(280px,82vw)] shrink-0 cursor-pointer overflow-hidden rounded-[12px] bg-[#15181d] prototype-listing-card sm:w-[180px]">
      <div className="absolute inset-0">
        <img alt="" className="absolute size-full object-cover" loading="lazy" src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRlbmRlcnMlMjBkb2N1bWVudHN8ZW58MXx8fHwxNzcxOTYwMzEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" />
        <div className="absolute bg-gradient-to-b from-transparent to-[#15181d] inset-0" />
      </div>
      <div className="relative flex flex-col justify-end size-full p-[15px]">
        <div className="flex flex-col gap-[8px]">
          <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold text-[20px] text-white" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[1.2]">Appel<br/>d'offres</p>
          </div>
          <div className="flex flex-col font-['Roboto_Flex:Medium',sans-serif] font-medium text-[12px] text-[#a3a3a3]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[1.4]">Découvrez les opportunités de collaboration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small Tender Card (216px height for sponsored section)
function SmallTenderCard({ tender, onClick }: { tender: TenderData; onClick?: () => void }) {
  const budgetLabel = formatListingMoney(tender.budget, tender.currency) || tender.budget;

  return (
    <div onClick={onClick} className="group ui-surface relative h-[216px] w-[min(280px,82vw)] shrink-0 cursor-pointer overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card sm:w-[180px]">
      <div aria-hidden="true" className="ui-border absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      <div className="flex h-full flex-col justify-between gap-[18px] p-[5px]">
        <div className="flex h-full flex-col justify-between px-[14px] py-[14px]">
          <div className="content-stretch relative flex w-full items-start gap-[12px]">
            <LogoText text={tender.organizationLetter} bg={tender.organizationColor} imageSrc={tender.companyLogo} alt={tender.organization} />
            <div className="content-stretch relative flex min-h-px min-w-px flex-[1_0_0] flex-col items-start gap-[6px] pr-[6px]">
              <div className="ui-text-main flex min-h-[34px] flex-col justify-start font-['Roboto_Flex:Bold',sans-serif] text-[14px] font-bold" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="line-clamp-2 break-normal leading-[1.2] [text-wrap:balance]">{tender.organization}</p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-[10px]">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="h-[12px] relative shrink-0 w-[13px]">
                <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]">
                  <Group />
                </div>
              </div>
              <span className="ui-text-soft line-clamp-1 min-w-0 break-normal font-['Roboto_Flex:Regular',sans-serif] text-[11px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                {tender.location}
              </span>
            </div>
            <div className="min-w-0">
              <div className="ui-text-main flex min-h-[36px] flex-col font-['Roboto_Flex:SemiBold',sans-serif] text-[14px] font-semibold" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="overflow-hidden leading-[1.25] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [text-overflow:clip]">{tender.title}</p>
              </div>
            </div>
            {budgetLabel ? (
              <p className="text-[13px] font-bold leading-[1.2] text-[#e11d2e]">{budgetLabel}</p>
            ) : null}
            <div className="ui-text-muted flex flex-col gap-1 text-[10px] leading-[1.3]">
              {tender.deadline ? <span>Date limite : {formatTenderDate(tender.deadline)}</span> : null}
              {tender.date ? <span>{formatRelativeTime(tender.date)}</span> : null}
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div />
            {tender.isAdminCreated && (
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


// Regular Tender Card (for main grid)
function TenderCard({ tender, onClick }: { tender: TenderData; onClick?: () => void }) {
  const budgetLabel = formatListingMoney(tender.budget, tender.currency) || tender.budget;

  return (
    <div onClick={onClick} className="group ui-surface relative h-[216px] w-full min-w-0 cursor-pointer overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card md:basis-[calc(50%-7px)] md:max-w-[calc(50%-7px)] lg:w-[180px] lg:max-w-[180px] lg:basis-[180px] lg:shrink-0">
      <div aria-hidden="true" className="ui-border absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      {tender.featured ? <ListingSponsoredBadge className="absolute left-3 top-3 z-20" label="SPONSORISÉ" /> : null}
      <div className="flex h-full flex-col justify-between gap-[18px] p-[5px]">
        <div className="flex h-full flex-col justify-between px-[14px] py-[14px]">
          <div className="content-stretch relative flex w-full items-start gap-[12px]">
            <LogoText text={tender.organizationLetter} bg={tender.organizationColor} imageSrc={tender.companyLogo} alt={tender.organization} />
            <div className="content-stretch relative flex min-h-px min-w-px flex-[1_0_0] flex-col items-start gap-[6px] pr-[6px]">
              <div className="ui-text-main flex min-h-[34px] flex-col justify-start font-['Roboto_Flex:Bold',sans-serif] text-[14px] font-bold" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="line-clamp-2 break-normal leading-[1.2] [text-wrap:balance]">{tender.organization}</p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-[10px]">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="h-[12px] relative shrink-0 w-[13px]">
                <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]">
                  <Group />
                </div>
              </div>
              <span className="ui-text-soft line-clamp-1 min-w-0 break-normal font-['Roboto_Flex:Regular',sans-serif] text-[11px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                {tender.location}
              </span>
            </div>
            <div className="min-w-0">
              <div className="ui-text-main flex min-h-[36px] flex-col font-['Roboto_Flex:SemiBold',sans-serif] text-[14px] font-semibold" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="overflow-hidden leading-[1.25] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [text-overflow:clip]">{tender.title}</p>
              </div>
            </div>
            {budgetLabel ? (
              <p className="text-[13px] font-bold leading-[1.2] text-[#e11d2e]">{budgetLabel}</p>
            ) : null}
            <div className="ui-text-muted flex flex-col gap-1 text-[10px] leading-[1.3]">
              {tender.deadline ? <span>Date limite : {formatTenderDate(tender.deadline)}</span> : null}
              {tender.date ? <span>{formatRelativeTime(tender.date)}</span> : null}
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div />
            {tender.isAdminCreated && (
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


function TenderCardSkeleton() {
  return (
    <div className="ui-surface relative h-[216px] w-full min-w-0 animate-pulse overflow-hidden rounded-[12px] border-[2px] border-[#efefef] md:basis-[calc(50%-7px)] md:max-w-[calc(50%-7px)] lg:w-[180px] lg:max-w-[180px] lg:basis-[180px] lg:shrink-0 dark:border-[#303030]">
      <div className="flex h-full flex-col justify-between gap-[18px] p-[5px]">
        <div className="flex h-full flex-col justify-between rounded-[8px] px-[14px] py-[14px]">
          <div className="flex items-start gap-[12px]">
            <div className="h-[38px] w-[38px] rounded-full bg-[#ececec] dark:bg-[#303030]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-[#ececec] dark:bg-[#303030]" />
              <div className="h-2.5 w-1/2 rounded bg-[#f1f1f1] dark:bg-[#262626]" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-5/6 rounded bg-[#ececec] dark:bg-[#303030]" />
            <div className="h-4 w-2/3 rounded bg-[#ececec] dark:bg-[#303030]" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-[#f1f1f1] dark:bg-[#262626]" />
              <div className="h-3 w-11/12 rounded bg-[#f1f1f1] dark:bg-[#262626]" />
              <div className="h-3 w-3/4 rounded bg-[#f1f1f1] dark:bg-[#262626]" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-7 w-[88px] rounded-full bg-[#f1f1f1] dark:bg-[#262626]" />
            <div className="h-7 w-7 rounded-[8px] bg-[#f1f1f1] dark:bg-[#262626]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TenderListCardSkeleton() {
  return (
    <div className="ui-card-flat w-full animate-pulse rounded-[12px] p-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-black/5 dark:bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/4 rounded bg-black/5 dark:bg-white/10" />
          <div className="h-4 w-1/2 rounded bg-black/5 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function TenderListActionIcons({
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
    <div className="flex items-center gap-1.5">
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
            "inline-flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors",
            isSaved
              ? "bg-[#27624f] text-white"
              : "text-[var(--text-soft)] hover:bg-[var(--surface-3)] hover:text-[#27624f]",
            isSaving ? "cursor-not-allowed opacity-60" : "",
          )}
        >
          <svg className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.435 6.582a5.54 5.54 0 00-7.84 0L12 8.177l-1.595-1.595a5.54 5.54 0 00-7.84 7.84l1.595 1.595L12 21.857l7.84-5.84 1.595-1.595a5.54 5.54 0 000-7.84z" />
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
        className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-soft)] transition-colors hover:bg-[var(--surface-3)] hover:text-[#27624f]"
      >
        <ShareArrowIcon className="h-4 w-4" />
      </button>
      {contactHref ? (
        <a
          href={contactHref}
          onClick={(event) => {
            event.stopPropagation();
          }}
          aria-label="Contacter"
          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#15803d] transition-colors hover:bg-[#ecfdf3] hover:text-[#166534]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-3 3-3-3z" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}

function TenderListCard({
  tender,
  onClick,
  canSave,
  isSaved,
  isSaving,
  onToggleSave,
  onShare,
  contactHref,
}: {
  tender: TenderData;
  onClick?: () => void;
  canSave: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  contactHref?: string | null;
}) {
  const budgetLabel = formatListingMoney(tender.budget, tender.currency) || tender.budget;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className="group relative flex w-full rounded-[12px] border border-transparent bg-transparent p-2.5 text-left transition-colors duration-300 hover:border-[var(--border-soft)] hover:bg-[var(--surface-2)]"
    >
      <div className="flex w-full items-center gap-3">
        <LogoText text={tender.organizationLetter} bg={tender.organizationColor} imageSrc={tender.companyLogo} alt={tender.organization} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            {tender.featured ? <ListingSponsoredBadge className="shrink-0 px-2 py-0.5 text-[8px] leading-none" label="SPONSORISÉ" /> : null}
            <span className="ui-text-main block truncate text-[11px] font-semibold leading-tight">{tender.organization}</span>
          </div>
          <div className="mt-0.5 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <h3 className="ui-text-main min-w-0 flex-1 truncate text-[16px] font-semibold leading-tight">{tender.title}</h3>
            <div className="flex min-w-0 items-center gap-3 text-[10px] leading-tight text-[var(--text-soft)]">
              {tender.location ? <span className="min-w-0 truncate">{tender.location}</span> : null}
              {tender.deadline ? <span className="shrink-0 font-medium text-[#b42318]">Clôture {formatTenderDate(tender.deadline)}</span> : null}
              {budgetLabel ? <span className="shrink-0 font-medium text-[#27624f]">{budgetLabel}</span> : null}
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {tender.isAdminCreated ? <div className="p-1 text-[#27624f]"><Union /></div> : null}
          <TenderListActionIcons canSave={canSave} isSaved={isSaved} isSaving={isSaving} onSave={onToggleSave} onShare={onShare} contactHref={contactHref} />
        </div>
      </div>
    </div>
  );
}

function TenderBusinessAccessCard({ isLoggedIn, onLoginClick }: { isLoggedIn: boolean; onLoginClick: () => void }) {
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

export default function AppelOffresPage() {
  const { isLoggedIn, setShowLoginModal, user, userPlan } = useAuth();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(() => readPublicListStringParamFromUrl("category", "Tous") || "Tous");
  const [selectedType, setSelectedType] = useState(() => readPublicListStringParamFromUrl("type", "Tous") || "Tous");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(() => readPublicListStringParamFromUrl("location", "") || null);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState(() => readPublicListStringParamFromUrl("search", ""));
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(() => readPublicListStringParamFromUrl("search", ""));
  const [currentPage, setCurrentPage] = useState(() => readPublicListPageFromUrl());
  const [activeFilterAccordion, setActiveFilterAccordion] = useState<"categories" | "location" | null>(null);
  const [isDesktopFilters, setIsDesktopFilters] = useState(false);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);
  const [viewMode, setViewMode] = useState<PublicListingViewMode>("list");
  const [listVisibleCount, setListVisibleCount] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedCategoryFilterRef = useRef(false);
  const isSyncingFiltersFromUrlRef = useRef(false);
  const resultsScrollRef = useScrollResultsIntoView<HTMLDivElement>(
    [
      selectedCategory,
      selectedType,
      selectedLocation || "",
      debouncedSearchQuery,
    ].join("|"),
  );
  const isCategoriesOpen = activeFilterAccordion === "categories";
  const toggleFilterAccordion = (accordion: "categories" | "location") => {
    setActiveFilterAccordion((current) => (current === accordion ? null : accordion));
  };
  const [selectedTender, setSelectedTender] = useState<TenderData | null>(null);
  const [isModalContactVisible, setIsModalContactVisible] = useState(false);
  const [isModalSaved, setIsModalSaved] = useState(false);
  const [isModalSaveReady, setIsModalSaveReady] = useState(false);
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ title: string; url: string; text?: string } | null>(null);
  const [quickSavedState, setQuickSavedState] = useState<Record<string, boolean>>({});
  const [quickSavingKey, setQuickSavingKey] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState("");
  const [relatedTenders, setRelatedTenders] = useState<TenderData[]>([]);
  const [remoteTenders, setRemoteTenders] = useState<TenderData[]>([]);
  const [featuredTendersSource, setFeaturedTendersSource] = useState<TenderData[]>([]);
  const [inlineAds, setInlineAds] = useState<PublicAdItem[]>([]);
  const [remoteCategoryTerms, setRemoteCategoryTerms] = useState<TaxonomyTermResult[]>([]);
  const [remoteLocationTerms, setRemoteLocationTerms] = useState<TaxonomyTermResult[]>([]);
  const [hasLoadedRemoteTenders, setHasLoadedRemoteTenders] = useState(false);
  const [listingsError, setListingsError] = useState(false);
  const [isListingsLoading, setIsListingsLoading] = useState(false);
  const [listingsPagination, setListingsPagination] = useState({
    page: 1,
    perPage: 30,
    total: 0,
    totalPages: 1,
  });
  const [isHtmlReady, setIsHtmlReady] = useState(false);
  const [posterRatingAverage, setPosterRatingAverage] = useState(0);
  const [posterRatingCount, setPosterRatingCount] = useState(0);
  const getTenderQuickKey = useCallback((tender: TenderData) => `tender:${tender.id}`, []);
  const tenderFilterCatalog = usePublicListingFilterCatalog("tender");

  useEffect(() => {
    if (!tenderFilterCatalog.catalog) return;
    setRemoteCategoryTerms(tenderFilterCatalog.catalog.categories);
    setRemoteLocationTerms(tenderFilterCatalog.catalog.locations);
  }, [tenderFilterCatalog.catalog]);

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

  // Expiration and location filtering are resolved by the paginated endpoint.
  const displayTenders = useMemo(() => sortTendersByMostRecent(remoteTenders), [remoteTenders]);
  const displayFeedItems = useMemo(() => injectInlinePublicAds(displayTenders, inlineAds), [displayTenders, inlineAds]);
  const visibleFeedItems = useMemo(
    () => (viewMode === "list" ? displayFeedItems.slice(0, listVisibleCount) : displayFeedItems),
    [displayFeedItems, listVisibleCount, viewMode],
  );
  const hasMoreListItems = viewMode === "list" && listVisibleCount < displayFeedItems.length;
  const featuredTenders = useMemo(() => featuredTendersSource.filter((tender) => tender.featured), [featuredTendersSource]);
  const normalizedSearchQuery = debouncedSearchQuery.trim();
  const activeCategoryFilter = selectedType !== "Tous" ? selectedType : selectedCategory !== "Tous" ? selectedCategory : "";
  const topLevelCategories = useMemo(
    () => sortTermsByDisplayOrder(remoteCategoryTerms.filter((term) => !term.parentId && !term.parentName)),
    [remoteCategoryTerms],
  );
  const activeCategoryChildren = useMemo(
    () => (selectedCategory === "Tous" ? [] : sortTermsByDisplayOrder(remoteCategoryTerms.filter((term) => term.parentName === selectedCategory))),
    [remoteCategoryTerms, selectedCategory],
  );
  const categoryNodes = useMemo(
    () =>
      topLevelCategories.map((term) => ({
        label: term.name,
        value: term.name,
        children: sortTermsByDisplayOrder(
          remoteCategoryTerms.filter(
            (candidate) => (candidate.parentName || "").trim().toLowerCase() === term.name.trim().toLowerCase(),
          ),
        ).map((child) => ({
          label: child.name,
          value: child.name,
        })),
      })),
    [remoteCategoryTerms, topLevelCategories],
  );
  const displayLocations = useMemo(
    () => buildUniqueNames(sortTermsByDisplayOrder(dedupeTaxonomyTermsByHierarchy(remoteLocationTerms))),
    [remoteLocationTerms],
  );
  const locationNodes = useMemo(
    () =>
      sortTermsByDisplayOrder(
        dedupeTaxonomyTermsByHierarchy(remoteLocationTerms.filter((term) => !term.parentId && !term.parentName)),
      ).map((term) => ({
        label: term.name,
        value: term.name,
        children: sortTermsByDisplayOrder(
          dedupeTaxonomyTermsByHierarchy(remoteLocationTerms.filter(
            (candidate) => (candidate.parentName || "").trim().toLowerCase() === term.name.trim().toLowerCase(),
          )),
        ).map((child) => ({
          label: child.name,
          value: child.name,
        })),
      })),
    [remoteLocationTerms],
  );

  const hasBusinessAccess = userPlan === "business";
  const hasPaidContactAccess = hasBusinessAccess;
  const isEmailVerificationRequired = isLoggedIn && user?.emailVerified === false;
  useEffect(() => {
    let cancelled = false;

    async function loadQuickSavedState() {
      if (!isLoggedIn || displayTenders.length === 0) {
        if (!cancelled) {
          setQuickSavedState({});
        }
        return;
      }

      try {
        const tenders = displayTenders.slice(0, 50);
        const response = await fetch(`/api/saved-items?keys=${encodeURIComponent(tenders.map((tender) => `tender:${tender.id}`).join(","))}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        const savedKeys = new Set<string>(response.ok && Array.isArray(payload?.savedKeys) ? payload.savedKeys : []);

        if (!cancelled) {
          setQuickSavedState(Object.fromEntries(tenders.map((tender) => [getTenderQuickKey(tender), savedKeys.has(`tender:${tender.id}`)])));
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
  }, [displayTenders, getTenderQuickKey, isLoggedIn]);
  const selectedTenderBudgetLabel = selectedTender
    ? formatListingMoney(selectedTender.budget, selectedTender.currency) || selectedTender.budget || ""
    : "";
  useEffect(() => {
    if (!selectedTender?.category.trim()) {
      setRelatedTenders([]);
      return;
    }

    setRelatedTenders([]);
    let cancelled = false;
    const query = new URLSearchParams({ category: selectedTender.category, perPage: "7" });

    void fetch(`/api/public/listings/tender?${query.toString()}`, { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (cancelled || !response.ok || !Array.isArray(payload?.items)) {
          return;
        }
        setRelatedTenders(payload.items.map(mapPublicListingToTender).filter((tender: TenderData) => tender.id !== selectedTender.id).slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) {
          setRelatedTenders([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTender?.category, selectedTender?.id]);
  const selectedTenderDetailHtml = useMemo(() => {
    if (!isHtmlReady || !selectedTender) {
      return "";
    }
    return sanitizeListingHtml(selectedTender.content || selectedTender.description || "");
  }, [isHtmlReady, selectedTender]);
  const selectedTenderDetailText = useMemo(
    () => extractPlainTextFromListingHtml(selectedTender?.content || selectedTender?.description || ""),
    [selectedTender?.content, selectedTender?.description],
  );

  const syncSelectedTenderFromUrl = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const slug = window.location.pathname.split("/").filter(Boolean).pop() || "";
    const itemId = extractListingIdFromSlug(slug);
    const matchedTender = displayTenders.find((tender) => tender.id === itemId) ?? null;
    setSelectedTender(matchedTender);
  }, [displayTenders]);

  const updateItemUrl = (item?: TenderData) => {
    if (typeof window === "undefined") {
      return;
    }

    const searchSuffix = currentPublicListSearchSuffix();
    const nextUrl = item
      ? `/appels-offres/${buildListingSlug(item.id, item.title, "appel-offres")}${searchSuffix}`
      : `/appels-offres${searchSuffix}`;
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
    setSelectedLocation(readPublicListStringParamFromUrl("location", "") || null);
    setSearchQuery(readPublicListStringParamFromUrl("search", ""));
    setDebouncedSearchQuery(readPublicListStringParamFromUrl("search", ""));
    window.setTimeout(() => {
      isSyncingFiltersFromUrlRef.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    setCurrentPage(readPublicListPageFromUrl());
    syncFiltersFromUrl();
  }, [searchParams, syncFiltersFromUrl]);

  const handlePageChange = (page: number) => {
    const safeTotalPages = Math.max(listingsPagination.totalPages || 1, 1);
    const nextPage = Math.min(Math.max(page, 1), safeTotalPages);
    if (nextPage === currentPage) {
      return;
    }
    setCurrentPage(nextPage);
    updatePublicListPageUrl(nextPage);
  };

  const openTender = (tender: TenderData) => {
    setInteractionError("");
    setSelectedTender(tender);
    updateItemUrl(tender);
  };

  const closeTender = () => {
    setInteractionError("");
    setIsModalContactVisible(false);
    setIsModalSaved(false);
    setIsModalSaveReady(false);
    setIsShareModalOpen(false);
    setPosterRatingAverage(0);
    setPosterRatingCount(0);
    setSelectedTender(null);
    updateItemUrl();
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      resetToFirstPage();
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedCategory === "Tous") {
      setExpandedCategory(null);
      return;
    }

    setExpandedCategory(selectedCategory);
  }, [selectedCategory]);
  useEffect(() => {
    if (!selectedLocation) {
      setExpandedLocation(null);
      return;
    }

    const parentWithChild = locationNodes.find((node) =>
      (node.children || []).some((child) => child.value === selectedLocation),
    );

    setExpandedLocation(parentWithChild?.value || selectedLocation);
  }, [locationNodes, selectedLocation]);

  useEffect(() => {
    let cancelled = false;

    const fetchSavedState = async () => {
      if (!selectedTender) return;
      setIsModalSaveReady(false);
      try {
        const response = await fetch(`/api/saved-items?kind=tender&itemId=${selectedTender.id}`, {
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
  }, [selectedTender]);

  async function handleToggleModalSave() {
    if (!selectedTender || isModalSaving || !isModalSaveReady) return;
    if (isEmailVerificationRequired) {
      setInteractionError("Vérification email requise pour enregistrer un appel d'offre.");
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
            kind: "tender",
            itemId: String(selectedTender.id),
            slug: buildListingSlug(selectedTender.id, selectedTender.title, "appel-offres"),
            title: selectedTender.title,
            description: selectedTender.description,
            location: selectedTender.location,
            sourceLabel: selectedTender.organization,
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

  async function handleQuickToggleSave(tender: TenderData) {
    const quickKey = getTenderQuickKey(tender);
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
            kind: "tender",
            itemId: String(tender.id),
            slug: buildListingSlug(tender.id, tender.title, "appel-offres"),
            title: tender.title,
            description: tender.description,
            location: tender.location,
            sourceLabel: tender.organization,
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

  async function handleQuickShare(tender: TenderData) {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/appels-offres/${buildListingSlug(tender.id, tender.title, "appel-offres")}`
        : `/appels-offres/${buildListingSlug(tender.id, tender.title, "appel-offres")}`;
    setShareTarget({ title: tender.title, url: shareUrl, text: tender.title });
    setIsShareModalOpen(true);
  }

  const selectedTenderShareUrl =
    typeof window !== "undefined" && selectedTender
      ? `${window.location.origin}/appels-offres/${buildListingSlug(selectedTender.id, selectedTender.title, "appel-offres")}`
      : "";

  useEffect(() => {
    setIsHtmlReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchFeatured = async () => {
      try {
        const featuredRes = await fetch("/api/public/listings/tender?perPage=50&featured=true", { cache: "no-store" });

        const featuredPayload = await featuredRes.json().catch(() => null);
        if (!cancelled && featuredRes.ok && Array.isArray(featuredPayload?.items)) {
          const mapped: TenderData[] = featuredPayload.items.map((item: any) => ({
            id: Number(item.id),
            organization: item.companyName || "Organisation",
            organizationLetter: String(item.companyName || "O").slice(0, 1).toUpperCase(),
            organizationColor: "#27624f",
            profilePhoto: item.companyLogo || "",
            companyLogo: item.companyLogo || "",
            location: item.location || "Madagascar",
            title: item.title || "Appel d'offres",
            description: extractPlainTextFromListingHtml(item.content || item.description || ""),
            excerpt: extractPlainTextFromListingHtml(item.excerpt || item.description || ""),
            content: item.content || "",
            budget: item.budget || "",
            currency: item.currency || "MGA",
            date: item.date || "",
            deadline: item.deadline || item.date || "",
            detailsPdfUrl: item.detailsPdfUrl || "",
            detailsPdfName: item.detailsPdfName || "",
            category: item.category || "Autres",
            type: item.type || "",
            featured: Boolean(item.featured),
            isAdminCreated: Boolean(item.isAdminCreated),
            contact: item.contactPhone || "",
            email: item.contactEmail || "",
            expiresAt: item.expiresAt || "",
            isExpired: Boolean(item.isExpired),
            ownerWpUserId: Number(item.ownerWpUserId || 0),
            ownerRatingAverage: Number(item.ownerRatingAverage || 0),
            ownerRatingCount: Number(item.ownerRatingCount || 0),
          }));
          setFeaturedTendersSource(sortTendersByMostRecent(mapped.filter((item) => !isTenderExpired(item))));
        }

      } catch {
        return;
      } finally {
        if (!cancelled) {
          setHasLoadedRemoteTenders(true);
        }
      }
    };

    fetchFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInlineAds = async () => {
      try {
        const response = await fetch("/api/public/ads?placement=inline_list&feature=tender", {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (cancelled) {
          return;
        }
        setInlineAds(response.ok && Array.isArray(payload?.items) ? payload.items : []);
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchRemoteListings = async () => {
      setIsListingsLoading(true);
      setListingsError(false);

      try {
        const query = new URLSearchParams({
          perPage: "30",
          page: String(currentPage),
        });

        if (normalizedSearchQuery) {
          query.set("search", normalizedSearchQuery);
        }

        if (selectedCategory !== "Tous") {
          query.set("category", selectedCategory);
        }

        if (selectedType !== "Tous") {
          query.set("type", selectedType);
        }

        if (selectedLocation) {
          query.set("location", selectedLocation);
        }

        const response = await fetch(`/api/public/listings/tender?${query.toString()}`, { cache: "no-store" });
        const payload = await response.json().catch(() => null);

        if (cancelled) {
          return;
        }

        if (!response.ok || !Array.isArray(payload?.items)) {
          setListingsError(true);
          setRemoteTenders([]);
          setListingsPagination((current) => ({ ...current, total: 0, totalPages: 1 }));
          return;
        }

        const totalPages = Math.max(Number(payload?.pagination?.totalPages || 1), 1);
        if (currentPage > totalPages) {
          setCurrentPage(totalPages);
          updatePublicListPageUrl(totalPages, true);
          return;
        }

        const mapped: TenderData[] = payload.items.map((item: any) => ({
          id: Number(item.id),
          organization: item.companyName || "Organisation",
          organizationLetter: String(item.companyName || "O").slice(0, 1).toUpperCase(),
          organizationColor: "#27624f",
          profilePhoto: item.companyLogo || "",
          companyLogo: item.companyLogo || "",
          location: item.location || "Madagascar",
          title: item.title || "Appel d'offres",
          description: extractPlainTextFromListingHtml(item.content || item.description || ""),
          excerpt: extractPlainTextFromListingHtml(item.excerpt || item.description || ""),
          content: item.content || "",
          budget: item.budget || "",
          currency: item.currency || "MGA",
          date: item.date || "",
          deadline: item.deadline || item.date || "",
          detailsPdfUrl: item.detailsPdfUrl || "",
          detailsPdfName: item.detailsPdfName || "",
          category: item.category || "Autres",
          type: item.type || "",
          featured: Boolean(item.featured),
          isAdminCreated: Boolean(item.isAdminCreated),
          contact: item.contactPhone || "",
          email: item.contactEmail || "",
          expiresAt: item.expiresAt || "",
          isExpired: Boolean(item.isExpired),
          ownerWpUserId: Number(item.ownerWpUserId || 0),
          ownerRatingAverage: Number(item.ownerRatingAverage || 0),
          ownerRatingCount: Number(item.ownerRatingCount || 0),
        }));

        setRemoteTenders(sortTendersByMostRecent(mapped));
        setListingsPagination({
          page: Number(payload?.pagination?.page || currentPage),
          perPage: Number(payload?.pagination?.perPage || 30),
          total: Number(payload?.pagination?.total || 0),
          totalPages,
        });
      } catch {
        if (!cancelled) {
          setListingsError(true);
          setRemoteTenders([]);
          setListingsPagination((current) => ({ ...current, total: 0, totalPages: 1 }));
        }
      } finally {
        if (!cancelled) {
          setIsListingsLoading(false);
          setHasLoadedRemoteTenders(true);
        }
      }
    };

    fetchRemoteListings();

    return () => {
      cancelled = true;
    };
  }, [activeCategoryFilter, currentPage, normalizedSearchQuery, selectedLocation]);

  useEffect(() => {
    setListVisibleCount(10);
    if (viewMode === "list" && currentPage !== 1) {
      setCurrentPage(1);
      updatePublicListPageUrl(1, true);
    }
  }, [activeCategoryFilter, normalizedSearchQuery, selectedCategory, selectedType, selectedLocation, viewMode]);

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
        if (!entry?.isIntersecting || isListingsLoading) {
          return;
        }

        if (typeof window !== "undefined" && window.scrollY < 120) {
          return;
        }

        if (listVisibleCount < displayFeedItems.length) {
          setListVisibleCount((current) => Math.min(current + 10, displayFeedItems.length));
          return;
        }

      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [currentPage, displayFeedItems.length, isListingsLoading, listVisibleCount, listingsPagination.totalPages, viewMode]);

  useEffect(() => {
    if (isSyncingFiltersFromUrlRef.current) {
      return;
    }

    if (remoteCategoryTerms.length === 0 && selectedCategory !== "Tous") {
      return;
    }

    if (!hasInitializedCategoryFilterRef.current) {
      hasInitializedCategoryFilterRef.current = true;
      return;
    }

    if (selectedCategory === "Tous") {
      setSelectedType("Tous");
      setActiveFilterAccordion((current) => (current === "type" ? null : current));
      return;
    }

    const stillAvailable = activeCategoryChildren.some((term) => term.name === selectedType);
    if (!stillAvailable) {
      setSelectedType("Tous");
    }
  }, [activeCategoryChildren, remoteCategoryTerms.length, selectedCategory, selectedType]);

  const hasActiveFilters = useMemo(
    () =>
      selectedCategory !== "Tous" ||
      selectedType !== "Tous" ||
      Boolean(selectedLocation) ||
      searchQuery.trim().length > 0,
    [searchQuery, selectedCategory, selectedLocation, selectedType],
  );

  const resetActiveFilters = useCallback(() => {
    setSelectedCategory("Tous");
    setSelectedType("Tous");
    setSelectedLocation(null);
    setExpandedLocation(null);
    setLocationSearch("");
    setSearchQuery("");
    setDebouncedSearchQuery("");
    resetToFirstPage();
  }, []);

  useEffect(() => {
    updatePublicListQueryParams({
      search: searchQuery,
      category: selectedCategory !== "Tous" ? selectedCategory : null,
      type: selectedType !== "Tous" ? selectedType : null,
      location: selectedLocation,
    });
  }, [searchQuery, selectedCategory, selectedLocation, selectedType]);

  useEffect(() => {
    syncSelectedTenderFromUrl();
  }, [syncSelectedTenderFromUrl]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(readPublicListPageFromUrl());
      syncFiltersFromUrl();
      syncSelectedTenderFromUrl();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [syncFiltersFromUrl, syncSelectedTenderFromUrl]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedTender) {
        closeTender();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedTender]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (selectedTender) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedTender]);

  return (
    <div className="public-listing-page relative w-full min-h-screen bg-white pb-[50px] font-['Roboto_Flex',sans-serif] text-[#111111] dark:bg-[var(--page-bg)] dark:text-white">
      <div className="content-stretch mx-auto flex w-full max-w-[1440px] flex-col items-center px-4 sm:px-6 lg:px-8">
        {featuredTenders.length > 0 ? (
          <div className="content-stretch relative flex w-full shrink-0 flex-col items-end gap-[16px] pt-[20px]">
            <div
              className="inline-flex shrink-0 items-center justify-center self-end rounded-[12px] border border-[#27624f] bg-[#fff1f2] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#27624f]"
              style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}
            >
              SPONSORISÉS
            </div>

            <SponsoredSlider
              leading={<FeaturedCard />}
              leadingClassName="hidden lg:block"
              items={featuredTenders}
              renderItem={(tender) => <SmallTenderCard key={`sponsored-${tender.id}`} tender={tender} onClick={() => openTender(tender)} />}
            />
          </div>
        ) : null}

        <PublicAdBannerRow placement="boost_list" />

        {/* Main Content: Sidebar + Tender List */}
        <div className="content-stretch relative flex w-full shrink-0 flex-col items-start gap-[14px] pt-[32px] lg:flex-row">
          
          {/* Sidebar Filters */}
          <div className={`${isDesktopFilters || isMobileFiltersVisible ? "flex" : "hidden"} listing-filter-panel bg-[#fcfcfc] dark:bg-[#2a2a2a] content-stretch relative w-full shrink-0 flex-col items-start rounded-[12px] lg:flex lg:w-[202px] prototype-listing-sidebar`}>
            <div className="relative w-full">
              <div aria-hidden="true" className="absolute border-[#e8e8e8] dark:border-[#3a3a3a] border-r border-solid inset-0 pointer-events-none rounded-[12px]" />
              <div className="content-stretch flex flex-col items-start relative w-full">
                {!isDesktopFilters ? (
                  <div className="flex w-full items-center justify-between border-b border-[#e8e8e8] px-[12px] py-[12px] dark:border-[#3a3a3a] lg:hidden">
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#191919] dark:text-white">Filtres</p>
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
                  title="Catégories"
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
                  selectedParent={selectedLocation || "Toutes"}
                  selectedChild="Toutes"
                  expandedParent={expandedLocation}
                  items={locationNodes}
                  onToggleParent={(value) =>
                    setExpandedLocation((current) => (current === value ? null : value))
                  }
                  onSelectAll={() => {
                    setSelectedLocation(null);
                    resetToFirstPage();
                  }}
                  onSelectParent={(value) => {
                    setSelectedLocation(value);
                    resetToFirstPage();
                  }}
                  onSelectChild={(_, childValue) => {
                    setSelectedLocation(childValue);
                    resetToFirstPage();
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tender List Section */}
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
                  <span className="font-semibold">RÉSULTATS </span>
                  <span className="font-normal">({listingsPagination.total})</span>
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
                {hasBusinessAccess ? (
                  <PublicListQuickCreateButton href="/profil/appels-offres" label="Créer un appel d'offres" />
                ) : isLoggedIn ? (
                  <PublicListQuickCreateButton href="/tarifs" label="Passer à Business" />
                ) : null}

                <PublicListingViewToggle value={viewMode} onChange={setViewMode} className="self-end sm:self-auto" />
              </div>
            </div>

            <PublicListingCollection
              viewMode={viewMode}
              isLoading={isListingsLoading && !hasLoadedRemoteTenders}
              items={visibleFeedItems}
              renderGridItem={(entry) => entry.kind === "advertisement"
                ? <InlinePublicListingAdCard key={`tender-ad-${entry.item.id}`} ad={entry.item} feature="tender" viewMode="grid" />
                : <TenderCard key={entry.item.id} tender={entry.item} onClick={() => openTender(entry.item)} />}
              renderListItem={(entry) => (
                entry.kind === "advertisement" ? (
                  <InlinePublicListingAdCard key={`tender-ad-list-${entry.item.id}`} ad={entry.item} feature="tender" viewMode="list" />
                ) : (
                  <TenderListCard
                    key={entry.item.id}
                    tender={entry.item}
                    onClick={() => openTender(entry.item)}
                    canSave={isLoggedIn}
                    isSaved={Boolean(quickSavedState[getTenderQuickKey(entry.item)])}
                    isSaving={quickSavingKey === getTenderQuickKey(entry.item)}
                    onToggleSave={() => {
                      void handleQuickToggleSave(entry.item);
                    }}
                    onShare={() => {
                      void handleQuickShare(entry.item);
                    }}
                    contactHref={
                      hasPaidContactAccess && !isEmailVerificationRequired
                        ? `/appels-offres/${buildListingSlug(entry.item.id, entry.item.title, "appel-offres")}/contacter`
                        : null
                    }
                  />
                )
              )}
              renderGridSkeleton={(index) => <TenderCardSkeleton key={`tender-skeleton-${index}`} />}
              renderListSkeleton={(index) => <TenderListCardSkeleton key={`tender-list-skeleton-${index}`} />}
              emptyState={<div className="ui-card-flat w-full rounded-[20px] border px-5 py-6">
                <p className="ui-text-main text-[14px] font-semibold">
                  {hasLoadedRemoteTenders
                    ? "Aucun appel d'offres disponible pour le moment."
                    : "Chargement des appels d'offres..."}
                </p>
                <p className="ui-text-muted mt-2 text-[13px] leading-[1.6]">
                  {hasLoadedRemoteTenders
                    ? "Les appels d'offres s'afficheront ici dès qu'ils seront publiés."
                    : "Nous récupérons les derniers appels d'offres publiés sur la plateforme."}
                </p>
              </div>}
            />
            <PublicListPagination
              currentPage={currentPage}
              totalPages={listingsPagination.totalPages}
              onPageChange={handlePageChange}
            />
            {viewMode === "list" && hasMoreListItems ? (
              <div ref={loadMoreRef} className="flex w-full items-center justify-center py-6 text-[12px] text-[#707070] dark:text-[#a1a1aa]">
                {isListingsLoading ? "Chargement..." : "Faites défiler pour charger plus"}
              </div>
            ) : null}
          </div>

        </div>
      </div>
      {selectedTender ? (
        <PublicListingDetailPage
          modal
          onClose={closeTender}
          backHref="/appels-offres"
          backLabel="Retour aux appels d'offres"
          mode="tender"
          item={selectedTender}
          bottomSimilarItems={relatedTenders}
          isOwner={Boolean(user?.wpUserId && Number(selectedTender.ownerWpUserId || 0) === Number(user.wpUserId))}
          ownerEditHref="/profil/appels-offres"
          sellerListingsHref="/appels-offres"
        />
      ) : null}
      <ShareSheetModal
        open={isShareModalOpen && Boolean(shareTarget)}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareTarget(null);
        }}
        title={shareTarget?.title || "Partager cet appel d'offres"}
        url={shareTarget?.url || selectedTenderShareUrl || (typeof window !== "undefined" ? window.location.href : "")}
        text={shareTarget?.text}
      />
    </div>
  );
}
