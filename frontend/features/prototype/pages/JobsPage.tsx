// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from "next/navigation";
import { CalendarClock, MapPin } from "lucide-react";
import { AppImage } from "@/components/ui/AppImage";
import clsx from "clsx";
import svgPaths from "@/features/prototype/imports/svg-h6eue3h5ci";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
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
import { useScrollResultsIntoView } from "@/lib/hooks/useScrollResultsIntoView";
import { usePublicListingFilterCatalog } from "@/lib/hooks/usePublicListingFilterCatalog";
import PublicListPagination from "@/features/prototype/components/PublicListPagination";
import PublicListQuickCreateButton from "@/features/prototype/components/PublicListQuickCreateButton";
import PublicAdBannerRow from "@/features/prototype/components/PublicAdBannerRow";
import InlinePublicListingAdCard from "@/features/prototype/components/InlinePublicListingAdCard";
import ListingSponsoredBadge from "@/features/prototype/components/ListingSponsoredBadge";
import ListingSkillRow from "@/features/prototype/components/ListingSkillRow";
import { JobListingGridCard } from "@/features/prototype/components/JobListingGridCard";
import PublicListingDetailPage from "@/features/prototype/components/PublicListingDetailPage";
import PublicListingCategoryFilter from "@/features/prototype/components/PublicListingCategoryFilter";
import PublicListingLocationFilter from "@/features/prototype/components/PublicListingLocationFilter";
import PublicListingTextFilter from "@/features/prototype/components/PublicListingTextFilter";
import PublicListingCollection, { PublicListingViewToggle, type PublicListingViewMode } from "@/features/prototype/components/PublicListingCollection";
import SponsoredSlider from "@/features/prototype/components/SponsoredSlider";
import { ShareArrowIcon } from "@/components/ui/ShareArrowIcon";
import { ShareSheetModal } from "@/components/ui/ShareSheetModal";
import type { PublicAdItem } from "@/lib/api/wordpress-internal";
import { dedupeTaxonomyTermsByHierarchy, type TaxonomyTermResult } from "@/lib/taxonomy/terms";
import { injectInlinePublicAds } from "@/lib/listings/inline-public-ads";
interface JobData {
  id: number;
  company: string;
  companyLetter: string;
  companyColor: string;
  profilePhoto?: string;
  companyLogo?: string;
  location: string;
  city?: string;
  area?: string;
  title: string;
  description: string;
  excerpt?: string;
  content?: string;
  date: string;
  category: string;
  type?: string;
  skills?: string[];
  experienceYears?: string;
  needBy?: string;
  deadline?: string;
  featured?: boolean;
  isAdminCreated?: boolean;
  contact?: string;
  email?: string;
  ownerWpUserId?: number;
  ownerRatingAverage?: number;
  ownerRatingCount?: number;
}

function mapPublicListingToJob(item: any): JobData {
  return {
    id: Number(item.id),
    company: item.companyName || "Entreprise",
    companyLetter: String(item.companyName || "E").slice(0, 1).toUpperCase(),
    companyColor: "#27624f",
    profilePhoto: item.companyLogo || "",
    companyLogo: item.companyLogo || "",
    location: buildJobLocation(item.city, item.area, item.location),
    city: item.city || item.regions?.[0] || "",
    area: item.area || item.cities?.[0] || "",
    title: item.title || "Offre",
    description: extractPlainTextFromListingHtml(item.content || item.description || ""),
    excerpt: extractPlainTextFromListingHtml(item.excerpt || item.description || ""),
    content: item.content || "",
    date: item.date || "",
    category: item.category || "Autres",
    type: item.type || "",
    skills: normalizeJobSkills(item.skills),
    experienceYears: item.experienceYears || "",
    needBy: item.needBy || "",
    deadline: item.deadline || "",
    featured: Boolean(item.featured),
    isAdminCreated: Boolean(item.isAdminCreated),
    contact: item.contactPhone || "",
    email: item.contactEmail || "",
    ownerWpUserId: Number(item.ownerWpUserId || 0),
    ownerRatingAverage: Number(item.ownerRatingAverage || 0),
    ownerRatingCount: Number(item.ownerRatingCount || 0),
  };
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
    <div className="relative flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]" style={{ backgroundColor: imageSrc ? "#fff" : bg }}>
      {imageSrc ? <AppImage alt={alt} className="h-full w-full object-contain p-0.5" src={imageSrc} eager /> : <span className="text-[13px] font-bold leading-none text-white">{text}</span>}
    </div>
  );
}

// Featured "Appels d'offre" card
function FeaturedCard() {
  return (
    <div className="relative h-[236px] w-[min(280px,82vw)] shrink-0 cursor-pointer overflow-hidden rounded-[12px] bg-[#15181d] prototype-listing-card sm:w-[180px]">
      <div className="absolute inset-0">
        <img alt="" className="absolute size-full object-cover" loading="lazy" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1080&q=80&fit=crop" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#15181d]" />
      </div>
      <div className="relative flex flex-col justify-end size-full p-[15px]">
        <div className="flex flex-col gap-[8px]">
          <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold text-[20px] text-white" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[1.2]">Offres d'emploi</p>
          </div>
          <div className="flex flex-col font-['Roboto_Flex:Medium',sans-serif] text-[12px] font-medium text-white/80" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[1.4]">Trouvez le poste qui correspond à vos ambitions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small Job Card (216px height for sponsored section)
function SmallJobCard({ job, onClick }: { job: JobData; onClick?: () => void }) {
  const statusLabel = getJobStatusLabel(job.deadline);
  const isClosed = getJobStatus(job.deadline) === "closed";
  const excerpt = truncateJobExcerpt(job.excerpt || job.description, 20);
  return (
    <div onClick={onClick} className="group ui-surface relative h-[236px] w-[min(280px,82vw)] shrink-0 cursor-pointer overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card sm:w-[180px]">
      <div aria-hidden="true" className="ui-border absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      <div className="flex h-full flex-col justify-between gap-[18px] p-[5px]">
        <div className="flex h-full flex-col justify-between px-[14px] py-[14px]">
          <div className="content-stretch relative flex w-full items-start gap-[12px]">
            <LogoText text={job.companyLetter} bg={job.companyColor} imageSrc={job.companyLogo} alt={job.company} />
            <div className="content-stretch relative flex min-h-px min-w-px flex-[1_0_0] flex-col items-start gap-[6px] pr-[6px]">
              <div className="ui-text-main flex min-h-[34px] flex-col justify-start font-['Roboto_Flex:Bold',sans-serif] text-[14px] font-bold" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="line-clamp-2 break-normal leading-[1.2] [text-wrap:balance]">{job.company}</p>
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
                {job.location}
              </span>
            </div>
            <div className="min-w-0">
              <div className="ui-text-main flex min-h-[36px] flex-col font-['Roboto_Flex:SemiBold',sans-serif] text-[14px] font-semibold" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="overflow-hidden leading-[1.25] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [text-overflow:clip]">{job.title}</p>
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
              <span>{formatRelativeTime(job.date)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            <div />
            {job.isAdminCreated && (
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

// Regular Job Card (for main grid)
function JobCard({ job, onClick }: { job: JobData; onClick?: () => void }) {
  const statusLabel = getJobStatusLabel(job.deadline);
  const isClosed = getJobStatus(job.deadline) === "closed";
  const excerpt = truncateJobExcerpt(job.excerpt || job.description, 20);

  return (
    <JobListingGridCard
      company={job.company}
      title={job.title}
      location={job.location}
      logoUrl={job.companyLogo}
      initial={job.companyLetter}
      color={job.companyColor}
      onClick={onClick}
      badge={job.featured ? <ListingSponsoredBadge className="absolute left-3 top-3 z-20" label="SPONSORISÉE" /> : null}
      className="w-full md:basis-[calc(50%-7px)] md:max-w-[calc(50%-7px)] lg:w-[180px] lg:max-w-[180px] lg:basis-[180px] lg:shrink-0"
      footer={
        <div className="mt-auto space-y-2">
          {excerpt ? <p className="ui-text-muted line-clamp-2 text-[11px] leading-[1.35]">{excerpt}</p> : null}
          <span className={clsx("inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em]", isClosed ? "bg-[#fff1f2] text-[#27624f]" : "bg-[#ecfdf3] text-[#15803d]")}>{statusLabel}</span>
          <p className="ui-text-muted text-[10px]">{formatRelativeTime(job.date)}</p>
        </div>
      }
    />
  );
}
function JobCardSkeleton() {
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

function JobListCardSkeleton() {
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

function JobListActionIcons({
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

function JobListCard({
  job,
  onClick,
  canSave,
  isSaved,
  isSaving,
  onToggleSave,
  onShare,
  contactHref,
}: {
  job: JobData;
  onClick?: () => void;
  canSave: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  contactHref?: string | null;
}) {
  const statusLabel = getJobStatusLabel(job.deadline);
  const isClosed = getJobStatus(job.deadline) === "closed";
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
        <LogoText text={job.companyLetter} bg={job.companyColor} imageSrc={job.companyLogo} alt={job.company} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            {job.featured ? <ListingSponsoredBadge className="shrink-0 px-2 py-0.5 text-[8px] leading-none" label="SPONSORISÉE" /> : null}
            <span className="ui-text-main truncate text-[11px] font-semibold leading-tight">{job.company}</span>
            <span className={clsx("inline-flex shrink-0 items-center gap-1 text-[9px] font-medium", isClosed ? "text-[#27624f]" : "text-[#15803d]")}>
              <span className={clsx("h-1.5 w-1.5 rounded-full", isClosed ? "bg-[#27624f]" : "bg-[#22c55e]")} aria-hidden="true" />
              {statusLabel}
            </span>
          </div>
          <div className="mt-0.5 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <h3 className="ui-text-main min-w-0 flex-1 truncate text-[16px] font-semibold leading-tight">{job.title}</h3>
            <div className="flex min-w-0 items-center gap-3 text-[10px] leading-tight text-[var(--text-soft)]">
              {job.location ? <span className="flex min-w-0 items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" strokeWidth={1.8} /><span className="truncate">{job.location}</span></span> : null}
              {job.deadline ? <span className="flex shrink-0 items-center gap-1 font-medium text-[#b42318]"><CalendarClock className="h-3 w-3" strokeWidth={1.8} />{formatListingMetaDate(job.deadline)}</span> : null}
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {job.isAdminCreated ? <div className="p-1 text-[#27624f]"><Union /></div> : null}
          <JobListActionIcons canSave={canSave} isSaved={isSaved} isSaving={isSaving} onSave={onToggleSave} onShare={onShare} contactHref={contactHref} />
        </div>
      </div>
    </div>
  );
}

function decodeEscapedUnicodeSequences(value: string) {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/u([0-9a-fA-F]{4})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function normalizeJobSkills(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => decodeEscapedUnicodeSequences(String(entry || "").trim()))
      .filter(Boolean)
      .slice(0, 5);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((entry) => decodeEscapedUnicodeSequences(entry.trim()))
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

export default function JobsPage() {
  const { isLoggedIn, setShowLoginModal, user, userPlan } = useAuth();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(() => readPublicListStringParamFromUrl("category", "Tous") || "Tous");
  const [selectedSubcategory, setSelectedSubcategory] = useState(() => readPublicListStringParamFromUrl("type", "Tous") || "Tous");
  const [selectedCity, setSelectedCity] = useState(() => readPublicListStringParamFromUrl("city", "Toutes") || "Toutes");
  const [selectedArea, setSelectedArea] = useState(() => readPublicListStringParamFromUrl("area", "Toutes") || "Toutes");
  const [locationSearch, setLocationSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState(() => {
    const nextOwnerFilter = readPublicListNumberParamFromUrl("ownerWpUserId", 0);
    return Number.isFinite(nextOwnerFilter) && nextOwnerFilter > 0 ? nextOwnerFilter : 0;
  });
  const [companyFilter, setCompanyFilter] = useState(() => readPublicListStringParamFromUrl("company", ""));
  const [searchQuery, setSearchQuery] = useState(() => readPublicListStringParamFromUrl("search", ""));
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(() => readPublicListStringParamFromUrl("search", ""));
  const [currentPage, setCurrentPage] = useState(() => readPublicListPageFromUrl());
  const [activeFilterAccordion, setActiveFilterAccordion] = useState<"categories" | "location" | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedLocationCity, setExpandedLocationCity] = useState<string | null>(null);
  const [isDesktopFilters, setIsDesktopFilters] = useState(false);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);
  const [viewMode, setViewMode] = useState<PublicListingViewMode>("list");
  const [listVisibleCount, setListVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedCityFilterRef = useRef(false);
  const hasInitializedCategoryFilterRef = useRef(false);
  const isSyncingFiltersFromUrlRef = useRef(false);
  const resultsScrollRef = useScrollResultsIntoView<HTMLDivElement>(
    [
      selectedCategory,
      selectedSubcategory,
      selectedCity,
      selectedArea,
      ownerFilter,
      companyFilter,
      debouncedSearchQuery,
    ].join("|"),
  );
  const isCategoriesOpen = activeFilterAccordion === "categories";
  const toggleFilterAccordion = (accordion: "categories" | "location") => {
    setActiveFilterAccordion((current) => (current === accordion ? null : accordion));
  };
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [isModalContactVisible, setIsModalContactVisible] = useState(false);
  const [isModalSaved, setIsModalSaved] = useState(false);
  const [isModalSaveReady, setIsModalSaveReady] = useState(false);
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ title: string; url: string; text?: string } | null>(null);
  const [quickSavedState, setQuickSavedState] = useState<Record<string, boolean>>({});
  const [quickSavingKey, setQuickSavingKey] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState("");
  const [relatedJobs, setRelatedJobs] = useState<JobData[]>([]);
  const [remoteJobs, setRemoteJobs] = useState<JobData[]>([]);
  const [featuredJobsSource, setFeaturedJobsSource] = useState<JobData[]>([]);
  const [inlineAds, setInlineAds] = useState<PublicAdItem[]>([]);
  const [remoteCategoryTerms, setRemoteCategoryTerms] = useState<TaxonomyTermResult[]>([]);
  const [remoteLocationTerms, setRemoteLocationTerms] = useState<TaxonomyTermResult[]>([]);
  const [hasLoadedRemoteJobs, setHasLoadedRemoteJobs] = useState(false);
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
  const getJobQuickKey = useCallback((job: JobData) => `job:${job.id}`, []);
  const jobFilterCatalog = usePublicListingFilterCatalog("job");

  useEffect(() => {
    if (!jobFilterCatalog.catalog) return;
    setRemoteCategoryTerms(jobFilterCatalog.catalog.categories);
    setRemoteLocationTerms(jobFilterCatalog.catalog.locations);
  }, [jobFilterCatalog.catalog]);

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

  // The public endpoint applies every active listing filter before paginating.
  const displayJobs = remoteJobs;
  const displayFeedItems = useMemo(() => injectInlinePublicAds(displayJobs, inlineAds), [displayJobs, inlineAds]);
  const visibleFeedItems = useMemo(
    () => (viewMode === "list" ? displayFeedItems.slice(0, listVisibleCount) : displayFeedItems),
    [displayFeedItems, listVisibleCount, viewMode],
  );
  const hasMoreListItems = viewMode === "list" && listVisibleCount < displayFeedItems.length;
  const activeOwnerDisplay = useMemo(() => {
    if (ownerFilter <= 0) {
      return null;
    }

    const matchingJob =
      remoteJobs.find((job) => Number(job.ownerWpUserId || 0) === ownerFilter) ??
      featuredJobsSource.find((job) => Number(job.ownerWpUserId || 0) === ownerFilter) ??
      null;

    const name = matchingJob?.company || companyFilter || `Recruteur #${ownerFilter}`;
    const image = matchingJob?.companyLogo || "";
    const initial = String(name || "R").trim().charAt(0).toUpperCase() || "R";

    return { name, image, initial };
  }, [companyFilter, featuredJobsSource, ownerFilter, remoteJobs]);
  // Sponsored jobs are an independent rail and remain visible even when the
  // main listing is narrowed to a company, category, location, or search.
  const featuredJobs = useMemo(() => featuredJobsSource.filter((job) => job.featured), [featuredJobsSource]);
  const normalizedSearchQuery = debouncedSearchQuery.trim();
  const activeCategoryFilter =
    selectedSubcategory !== "Tous" ? selectedSubcategory : selectedCategory !== "Tous" ? selectedCategory : "";
  const topLevelCategories = useMemo(
    () => sortTermsByDisplayOrder(remoteCategoryTerms.filter((term) => !term.parentId && !term.parentName)),
    [remoteCategoryTerms],
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
  const displayCities = useMemo(
    () => [
      "Toutes",
      ...buildUniqueNames(
        sortTermsByDisplayOrder(
          dedupeTaxonomyTermsByHierarchy(remoteLocationTerms.filter((term) => !term.parentId && !term.parentName)),
        ),
      ),
    ],
    [remoteLocationTerms],
  );
  const displayAreas = useMemo(() => {
    if (selectedCity === "Toutes") {
      return ["Toutes"];
    }

    return [
      "Toutes",
      ...buildUniqueNames(
        sortTermsByDisplayOrder(
          dedupeTaxonomyTermsByHierarchy(remoteLocationTerms.filter(
          (term) => (term.parentName || "").trim().toLowerCase() === selectedCity.trim().toLowerCase(),
          )),
        ),
      ),
    ];
  }, [remoteLocationTerms, selectedCity]);
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

  const hasPaidContactAccess = userPlan === "essentiel" || userPlan === "business";
  const isEmailVerificationRequired = isLoggedIn && user?.emailVerified === false;
  useEffect(() => {
    let cancelled = false;

    async function loadQuickSavedState() {
      if (!isLoggedIn || displayJobs.length === 0) {
        if (!cancelled) {
          setQuickSavedState({});
        }
        return;
      }

      try {
        const jobs = displayJobs.slice(0, 50);
        const response = await fetch(`/api/saved-items?keys=${encodeURIComponent(jobs.map((job) => `job:${job.id}`).join(","))}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        const savedKeys = new Set<string>(response.ok && Array.isArray(payload?.savedKeys) ? payload.savedKeys : []);

        if (!cancelled) {
          setQuickSavedState(Object.fromEntries(jobs.map((job) => [getJobQuickKey(job), savedKeys.has(`job:${job.id}`)])));
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
  }, [displayJobs, getJobQuickKey, isLoggedIn]);
  useEffect(() => {
    if (!selectedJob?.category.trim()) {
      setRelatedJobs([]);
      return;
    }

    setRelatedJobs([]);
    let cancelled = false;
    const query = new URLSearchParams({ category: selectedJob.category, perPage: "7" });

    void fetch(`/api/public/listings/job?${query.toString()}`, { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (cancelled || !response.ok || !Array.isArray(payload?.items)) {
          return;
        }
        setRelatedJobs(payload.items.map(mapPublicListingToJob).filter((job: JobData) => job.id !== selectedJob.id).slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) {
          setRelatedJobs([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedJob?.category, selectedJob?.id]);
  const selectedJobDetailHtml = useMemo(() => {
    if (!isHtmlReady || !selectedJob) {
      return "";
    }
    return sanitizeListingHtml(selectedJob.content || selectedJob.description || "");
  }, [isHtmlReady, selectedJob]);
  const selectedJobDetailText = useMemo(
    () => extractPlainTextFromListingHtml(selectedJob?.content || selectedJob?.description || ""),
    [selectedJob?.content, selectedJob?.description],
  );

  const syncSelectedJobFromUrl = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const slug = window.location.pathname.split("/").filter(Boolean).pop() || "";
    const itemId = extractListingIdFromSlug(slug);
    const matchedJob = displayJobs.find((job) => job.id === itemId) ?? null;
    setSelectedJob(matchedJob);
  }, [displayJobs]);

  const updateItemUrl = (item?: JobData) => {
    if (typeof window === "undefined") {
      return;
    }

    const searchSuffix = currentPublicListSearchSuffix();
    const nextUrl = item
      ? `/offres-emploi/${buildListingSlug(item.id, item.title, "offre")}${searchSuffix}`
      : `/offres-emploi${searchSuffix}`;
    window.history.pushState({}, "", nextUrl);
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
    updatePublicListPageUrl(1, true);
  };

  const syncFiltersFromUrl = useCallback(() => {
    isSyncingFiltersFromUrlRef.current = true;
    setSelectedCategory(readPublicListStringParamFromUrl("category", "Tous") || "Tous");
    setSelectedSubcategory(readPublicListStringParamFromUrl("type", "Tous") || "Tous");
    setSelectedCity(readPublicListStringParamFromUrl("city", "Toutes") || "Toutes");
    setSelectedArea(readPublicListStringParamFromUrl("area", "Toutes") || "Toutes");
    setSearchQuery(readPublicListStringParamFromUrl("search", ""));
    setDebouncedSearchQuery(readPublicListStringParamFromUrl("search", ""));

    const nextOwnerFilter = readPublicListNumberParamFromUrl("ownerWpUserId", 0);
    setOwnerFilter(Number.isFinite(nextOwnerFilter) && nextOwnerFilter > 0 ? nextOwnerFilter : 0);
    setCompanyFilter(readPublicListStringParamFromUrl("company", ""));
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
    setCompanyFilter("");
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
      selectedSubcategory !== "Tous" ||
      selectedCity !== "Toutes" ||
      selectedArea !== "Toutes" ||
      ownerFilter > 0 ||
      searchQuery.trim().length > 0,
    [ownerFilter, searchQuery, selectedArea, selectedCategory, selectedCity, selectedSubcategory],
  );

  const resetActiveFilters = useCallback(() => {
    setSelectedCategory("Tous");
    setSelectedSubcategory("Tous");
    setSelectedCity("Toutes");
    setSelectedArea("Toutes");
    setLocationSearch("");
    setOwnerFilter(0);
    setCompanyFilter("");
    setSearchQuery("");
    setDebouncedSearchQuery("");
    resetToFirstPage();
  }, []);

  useEffect(() => {
    if (isSyncingFiltersFromUrlRef.current) {
      return;
    }

    if (!hasInitializedCityFilterRef.current) {
      hasInitializedCityFilterRef.current = true;
      return;
    }

    setSelectedArea("Toutes");
  }, [selectedCity]);

  useEffect(() => {
    if (isSyncingFiltersFromUrlRef.current) {
      return;
    }

    if (!hasInitializedCategoryFilterRef.current) {
      hasInitializedCategoryFilterRef.current = true;
      return;
    }

    setSelectedSubcategory("Tous");
  }, [selectedCategory]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      resetToFirstPage();
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (!hasLoadedRemoteJobs) {
      return;
    }

    if (displayCities.includes(selectedCity)) {
      return;
    }

    setSelectedCity("Toutes");
  }, [displayCities, hasLoadedRemoteJobs, selectedCity]);

  useEffect(() => {
    if (!hasLoadedRemoteJobs) {
      return;
    }

    if (displayAreas.includes(selectedArea)) {
      return;
    }

    setSelectedArea("Toutes");
  }, [displayAreas, hasLoadedRemoteJobs, selectedArea]);

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

  useEffect(() => {
    resetToFirstPage();
  }, [selectedArea, selectedCity]);

  const handlePageChange = (page: number) => {
    const safeTotalPages = Math.max(listingsPagination.totalPages || 1, 1);
    const nextPage = Math.min(Math.max(page, 1), safeTotalPages);
    if (nextPage === currentPage) {
      return;
    }
    setCurrentPage(nextPage);
    updatePublicListPageUrl(nextPage);
  };

  const openJob = (job: JobData) => {
    setInteractionError("");
    setSelectedJob(job);
    updateItemUrl(job);
  };

  const closeJob = () => {
    setInteractionError("");
    setIsModalContactVisible(false);
    setIsModalSaved(false);
    setIsModalSaveReady(false);
    setIsShareModalOpen(false);
    setPosterRatingAverage(0);
    setPosterRatingCount(0);
    setSelectedJob(null);
    updateItemUrl();
  };

  useEffect(() => {
    let cancelled = false;

    const fetchSavedState = async () => {
      if (!selectedJob) return;
      setIsModalSaveReady(false);
      try {
        const response = await fetch(`/api/saved-items?kind=job&itemId=${selectedJob.id}`, {
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
  }, [selectedJob]);

  async function handleToggleModalSave() {
    if (!selectedJob || isModalSaving || !isModalSaveReady) return;
    if (isEmailVerificationRequired) {
      setInteractionError("Vérification email requise pour enregistrer une offre d'emploi.");
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
            kind: "job",
            itemId: String(selectedJob.id),
            slug: buildListingSlug(selectedJob.id, selectedJob.title, "offre"),
            title: selectedJob.title,
            description: selectedJob.description,
            location: selectedJob.location,
            sourceLabel: selectedJob.company,
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

  async function handleQuickToggleSave(job: JobData) {
    const quickKey = getJobQuickKey(job);
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
            kind: "job",
            itemId: String(job.id),
            slug: buildListingSlug(job.id, job.title, "offre"),
            title: job.title,
            description: job.description,
            image: job.profilePhoto,
            location: job.location,
            sourceLabel: job.company,
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

  async function handleQuickShare(job: JobData) {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/offres-emploi/${buildListingSlug(job.id, job.title, "offre")}`
        : `/offres-emploi/${buildListingSlug(job.id, job.title, "offre")}`;
    setShareTarget({ title: job.title, url: shareUrl, text: job.title });
    setIsShareModalOpen(true);
  }

  const selectedJobShareUrl =
    typeof window !== "undefined" && selectedJob
      ? `${window.location.origin}/offres-emploi/${buildListingSlug(selectedJob.id, selectedJob.title, "offre")}`
      : "";

  useEffect(() => {
    setIsHtmlReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchFeatured = async () => {
      try {
        const featuredRes = await fetch("/api/public/listings/job?perPage=50&featured=true", { cache: "no-store" });

        const featuredPayload = await featuredRes.json().catch(() => null);
        if (!cancelled && featuredRes.ok && Array.isArray(featuredPayload?.items)) {
          const mapped: JobData[] = featuredPayload.items.map((item: any) => ({
            id: Number(item.id),
            company: item.companyName || "Entreprise",
            companyLetter: String(item.companyName || "E").slice(0, 1).toUpperCase(),
            companyColor: "#27624f",
            profilePhoto: item.companyLogo || "",
            companyLogo: item.companyLogo || "",
            location: buildJobLocation(item.city, item.area, item.location),
            city: item.city || item.regions?.[0] || "",
            area: item.area || item.cities?.[0] || "",
            title: item.title || "Offre",
            description: extractPlainTextFromListingHtml(item.content || item.description || ""),
            excerpt: extractPlainTextFromListingHtml(item.excerpt || item.description || ""),
            content: item.content || "",
            date: item.date || "",
            category: item.category || "Autres",
            type: item.type || "",
            skills: normalizeJobSkills(item.skills),
            experienceYears: item.experienceYears || "",
            needBy: item.needBy || "",
            deadline: item.deadline || "",
            featured: Boolean(item.featured),
            isAdminCreated: Boolean(item.isAdminCreated),
            contact: item.contactPhone || "",
            email: item.contactEmail || "",
            ownerWpUserId: Number(item.ownerWpUserId || 0),
            ownerRatingAverage: Number(item.ownerRatingAverage || 0),
            ownerRatingCount: Number(item.ownerRatingCount || 0),
          }));
          setFeaturedJobsSource(mapped);
        }

      } catch {
        return;
      } finally {
        if (!cancelled) {
          setHasLoadedRemoteJobs(true);
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
        const response = await fetch("/api/public/ads?placement=inline_list&feature=job", {
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
    let activeRequest: AbortController | null = null;

    const fetchRemoteListings = async () => {
      setIsListingsLoading(true);
      setListingsError(false);

      try {
        const isCompanyDirectoryFilterActive = companyFilter.trim().length > 0 && normalizedSearchQuery.length === 0;
        const query = new URLSearchParams({
          perPage: isCompanyDirectoryFilterActive ? "100" : "30",
          page: String(currentPage),
        });

        if (normalizedSearchQuery) {
          query.set("search", normalizedSearchQuery);
        }

        if (selectedCategory !== "Tous") {
          query.set("category", selectedCategory);
        }

        if (selectedSubcategory !== "Tous") {
          query.set("type", selectedSubcategory);
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

        if (ownerFilter <= 0 && companyFilter.trim()) {
          query.set("company", companyFilter.trim());
        }

        // A busy WordPress worker must not leave the public list in its loading
        // state forever. The backend remains the source of truth; this only
        // bounds one client request and lets the next navigation retry.
        activeRequest = new AbortController();
        const timeout = window.setTimeout(() => activeRequest?.abort(), 15_000);
        let response: Response;
        try {
          response = await fetch(`/api/public/listings/job?${query.toString()}`, {
            cache: "no-store",
            signal: activeRequest.signal,
          });
        } finally {
          window.clearTimeout(timeout);
        }
        const payload = await response.json().catch(() => null);

        if (cancelled) {
          return;
        }

        if (!response.ok || !Array.isArray(payload?.items)) {
          setListingsError(true);
          return;
        }

        const totalPages = Math.max(Number(payload?.pagination?.totalPages || 1), 1);
        if (currentPage > totalPages) {
          setCurrentPage(totalPages);
          updatePublicListPageUrl(totalPages, true);
          return;
        }

          const mapped: JobData[] = payload.items.map((item: any) => ({
            id: Number(item.id),
            company: item.companyName || "Entreprise",
            companyLetter: String(item.companyName || "E").slice(0, 1).toUpperCase(),
            companyColor: "#27624f",
            profilePhoto: item.companyLogo || "",
            companyLogo: item.companyLogo || "",
            location: buildJobLocation(item.city, item.area, item.location),
            city: item.city || item.regions?.[0] || "",
            area: item.area || item.cities?.[0] || "",
            title: item.title || "Offre",
            description: extractPlainTextFromListingHtml(item.content || item.description || ""),
            excerpt: extractPlainTextFromListingHtml(item.excerpt || item.description || ""),
            content: item.content || "",
            date: item.date || "",
            category: item.category || "Autres",
            type: item.type || "",
            skills: normalizeJobSkills(item.skills),
            experienceYears: item.experienceYears || "",
            needBy: item.needBy || "",
            deadline: item.deadline || "",
            featured: Boolean(item.featured),
            isAdminCreated: Boolean(item.isAdminCreated),
            contact: item.contactPhone || "",
            email: item.contactEmail || "",
            ownerWpUserId: Number(item.ownerWpUserId || 0),
            ownerRatingAverage: Number(item.ownerRatingAverage || 0),
            ownerRatingCount: Number(item.ownerRatingCount || 0),
          }));

        setRemoteJobs(mapped);
        setListingsPagination({
          page: Number(payload?.pagination?.page || currentPage),
          perPage: Number(payload?.pagination?.perPage || 30),
          total: Number(payload?.pagination?.total || 0),
          totalPages,
        });
      } catch {
        if (!cancelled) {
          setListingsError(true);
        }
      } finally {
        if (!cancelled) {
          setIsListingsLoading(false);
          setHasLoadedRemoteJobs(true);
        }
      }
    };

    fetchRemoteListings();

    return () => {
      cancelled = true;
      activeRequest?.abort();
    };
  }, [activeCategoryFilter, companyFilter, currentPage, normalizedSearchQuery, ownerFilter, selectedArea, selectedCity]);

  useEffect(() => {
    setListVisibleCount(20);
    if (viewMode === "list" && currentPage !== 1) {
      setCurrentPage(1);
      updatePublicListPageUrl(1, true);
    }
  }, [activeCategoryFilter, companyFilter, normalizedSearchQuery, ownerFilter, selectedArea, selectedCity, viewMode]);

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
          setListVisibleCount((current) => Math.min(current + 20, displayFeedItems.length));
          return;
        }

      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [currentPage, displayFeedItems.length, isListingsLoading, listVisibleCount, listingsPagination.totalPages, viewMode]);

  useEffect(() => {
    updatePublicListQueryParams({
      search: searchQuery,
      category: selectedCategory !== "Tous" ? selectedCategory : null,
      type: selectedSubcategory !== "Tous" ? selectedSubcategory : null,
      city: selectedCity !== "Toutes" ? selectedCity : null,
      area: selectedArea !== "Toutes" ? selectedArea : null,
      ownerWpUserId: ownerFilter > 0 ? ownerFilter : null,
      company: ownerFilter > 0 ? companyFilter : null,
    });
  }, [companyFilter, ownerFilter, searchQuery, selectedArea, selectedCategory, selectedCity, selectedSubcategory]);

  useEffect(() => {
    syncSelectedJobFromUrl();
  }, [syncSelectedJobFromUrl]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(readPublicListPageFromUrl());
      syncFiltersFromUrl();
      syncSelectedJobFromUrl();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [syncFiltersFromUrl, syncSelectedJobFromUrl]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedJob) {
        closeJob();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedJob]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (selectedJob) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedJob]);

  return (
    <div className="public-listing-page relative w-full min-h-screen bg-white pb-[50px] font-['Roboto_Flex',sans-serif] text-[#111111] dark:bg-[var(--page-bg)] dark:text-white">
      <div className="content-stretch mx-auto flex w-full max-w-[1440px] flex-col items-center px-4 sm:px-6 lg:px-8">
        {featuredJobs.length > 0 ? (
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
              items={featuredJobs}
              renderItem={(job) => <SmallJobCard key={`sponsored-${job.id}`} job={job} onClick={() => openJob(job)} />}
            />
          </div>
        ) : null}

        <PublicAdBannerRow placement="boost_list" />

        {/* Main Content: Sidebar + Job List */}
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
                  isOpen={isCategoriesOpen}
                  isDesktopFilters={isDesktopFilters}
                  selectedParent={selectedCategory}
                  selectedChild={selectedSubcategory}
                  expandedParent={expandedCategory}
                  items={categoryNodes}
                  onToggleSection={() => toggleFilterAccordion("categories")}
                  onToggleParent={(value) =>
                    setExpandedCategory((current) => (current === value ? null : value))
                  }
                  onSelectAll={() => {
                    setSelectedCategory("Tous");
                    setSelectedSubcategory("Tous");
                    resetToFirstPage();
                  }}
                  onSelectParent={(value) => {
                    setSelectedCategory(value);
                    setSelectedSubcategory("Tous");
                    resetToFirstPage();
                  }}
                  onSelectChild={(parentValue, childValue) => {
                    setSelectedCategory(parentValue);
                    setSelectedSubcategory(childValue);
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

              </div>
            </div>
          </div>

          {/* Job List Section */}
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
              <div className="ui-text-main flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[1.4] not-italic relative shrink-0 text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
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
                {isLoggedIn ? (
                  userPlan === "essentiel" || userPlan === "business" ? (
                    <PublicListQuickCreateButton href="/profil/offres-emploi" label="Créer une offre d'emploi" />
                  ) : (
                    <PublicListQuickCreateButton href="/tarifs" label="Passer à Essentiel" />
                  )
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
                    Filtre recruteur actif : {activeOwnerDisplay.name}
                  </span>
                  <button
                    type="button"
                    onClick={clearOwnerFilter}
                    aria-label="Retirer le filtre recruteur"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/5 text-[12px] transition hover:bg-[#27624f] hover:text-white dark:bg-white/10"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : null}

            <PublicListingCollection
              viewMode={viewMode}
              isLoading={isListingsLoading && !hasLoadedRemoteJobs}
              items={visibleFeedItems}
              renderGridItem={(entry) => entry.kind === "advertisement"
                ? <InlinePublicListingAdCard key={`job-ad-${entry.item.id}`} ad={entry.item} feature="job" viewMode="grid" />
                : <JobCard key={entry.item.id} job={entry.item} onClick={() => openJob(entry.item)} />}
              renderListItem={(entry) => (
                entry.kind === "advertisement" ? (
                  <InlinePublicListingAdCard key={`job-ad-list-${entry.item.id}`} ad={entry.item} feature="job" viewMode="list" />
                ) : (
                  <JobListCard
                    key={entry.item.id}
                    job={entry.item}
                    onClick={() => openJob(entry.item)}
                    canSave={isLoggedIn}
                    isSaved={Boolean(quickSavedState[getJobQuickKey(entry.item)])}
                    isSaving={quickSavingKey === getJobQuickKey(entry.item)}
                    onToggleSave={() => {
                      void handleQuickToggleSave(entry.item);
                    }}
                    onShare={() => {
                      void handleQuickShare(entry.item);
                    }}
                    contactHref={
                      hasPaidContactAccess && !isEmailVerificationRequired
                        ? `/offres-emploi/${buildListingSlug(entry.item.id, entry.item.title, "offre")}/contacter`
                        : null
                    }
                  />
                )
              )}
              renderGridSkeleton={(index) => <JobCardSkeleton key={`job-skeleton-${index}`} />}
              renderListSkeleton={(index) => <JobListCardSkeleton key={`job-list-skeleton-${index}`} />}
              emptyState={<div className="ui-card-flat ui-border w-full rounded-[20px] border px-5 py-6">
                <p className="ui-text-main text-[14px] font-semibold">
                  {isListingsLoading && !hasLoadedRemoteJobs
                    ? "Chargement des offres d'emploi..."
                    : listingsError
                      ? "Impossible de charger les offres d'emploi pour le moment."
                      : hasLoadedRemoteJobs
                    ? "Aucune offre d'emploi disponible pour le moment."
                    : "Chargement des offres d'emploi..."}
                </p>
                <p className="ui-text-muted mt-2 text-[13px] leading-[1.6]">
                  {listingsError
                    ? "Nous n'avons pas réussi à récupérer les offres publiques. Merci de réessayer dans un instant."
                    : hasLoadedRemoteJobs
                    ? "Les offres s'afficheront ici dès qu'elles seront publiées."
                    : "Nous récupérons les dernières offres publiées sur la plateforme."}
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
      {selectedJob ? (
        <PublicListingDetailPage
          modal
          onClose={closeJob}
          backHref="/offres-emploi"
          backLabel="Retour aux offres d'emploi"
          mode="job"
          item={selectedJob}
          bottomSimilarItems={relatedJobs}
          isOwner={Boolean(user?.wpUserId && Number(selectedJob.ownerWpUserId || 0) === Number(user.wpUserId))}
          ownerEditHref="/profil/offres-emploi"
          sellerListingsHref={
            selectedJob.ownerWpUserId
              ? `/offres-emploi?ownerWpUserId=${selectedJob.ownerWpUserId}&company=${encodeURIComponent(selectedJob.company)}`
              : "/offres-emploi"
          }
        />
      ) : null}
      <ShareSheetModal
        open={isShareModalOpen && Boolean(shareTarget)}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareTarget(null);
        }}
        title={shareTarget?.title || "Partager cette offre"}
        url={shareTarget?.url || selectedJobShareUrl || (typeof window !== "undefined" ? window.location.href : "")}
        text={shareTarget?.text}
      />
    </div>
  );
}
