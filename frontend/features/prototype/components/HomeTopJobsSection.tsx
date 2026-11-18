"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Link } from "@/features/prototype/router-compat";

import { CompanyCard } from "@/features/prototype/components/CompanyCard";
import { HomeRailCtaCard } from "@/features/prototype/components/HomeRailCtaCard";
import ListingOwnerPlanBadge, { type ListingOwnerPlanId } from "@/features/prototype/components/ListingOwnerPlanBadge";
import { SectionHeading } from "@/features/prototype/components/SectionHeading";

type HomeJobItem = {
  id: number;
  title: string;
  companyName?: string;
  publisherName?: string;
  location?: string;
  slug?: string;
  profilePhoto?: string;
  companyLogo?: string;
  ownerWpUserId?: number;
  date?: string;
  expiresAt?: string;
};

type JobsApiResponse = {
  items?: HomeJobItem[];
};

const OPENING_JOB_COUNT = 10;
const JOB_RAIL_COUNT = 5;
const HOME_JOB_REQUEST_COUNT = OPENING_JOB_COUNT + JOB_RAIL_COUNT;
const OPENING_DIRECTORY_COUNT = 4;

function TopJobsSkeleton() {
  return (
    <div className="mb-6 lg:mb-8">
      <div className="mb-3 h-5 w-40 rounded bg-[var(--surface-4)]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[132px] animate-pulse rounded-[18px] bg-[var(--surface-3)]"
        />
      ))}
      </div>
    </div>
  );
}

function pickAccentColor(name: string) {
  const palette = ["#10B981", "#8B5CF6", "#0F172A", "#F97316", "#3B82F6", "#DC2626", "#14B8A6", "#F59E0B"];
  const seed = Array.from(name || "").reduce((total, character) => total + character.charCodeAt(0), 0);
  return palette[seed % palette.length] || "#10B981";
}

function formatExpiryDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `Expire le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date)}`;
}

export function HomeTopJobsSection() {
  const [items, setItems] = useState<HomeJobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      try {
        const response = await fetch(`/api/public/listings/job?perPage=${HOME_JOB_REQUEST_COUNT}`, { cache: "no-store" });
        const payload = (await response.json()) as JobsApiResponse;

        if (!response.ok) {
          throw new Error("Unable to load jobs.");
        }

        if (isMounted) {
          setItems(Array.isArray(payload.items) ? payload.items.slice(OPENING_JOB_COUNT, HOME_JOB_REQUEST_COUNT) : []);
        }
      } catch {
        if (isMounted) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const jobs = useMemo(
    () =>
      items.map((job) => {
        const companyName = job.companyName || job.publisherName || "Entreprise";
        return {
          ...job,
          companyName,
          initial: companyName.charAt(0).toUpperCase() || "E",
          accent: pickAccentColor(companyName),
        };
      }),
    [items],
  );

  if (isLoading) {
    return <TopJobsSkeleton />;
  }

  const ctaCount = jobs.length === 0 ? 1 : 0;

  return (
    <section className="mb-6 lg:mb-8">
      <SectionHeading title="Top emplois" href="/offres-emploi" />
      <div className="home-browse-shelf grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {jobs.map((job) => (
        <CompanyCard
          key={job.id}
          initial={job.initial}
          companyName={job.companyName}
          position={job.title}
          location={job.location}
          color={job.accent}
          logoUrl={job.companyLogo}
          href={
            job.ownerWpUserId
              ? `/offres-emploi?ownerWpUserId=${job.ownerWpUserId}&company=${encodeURIComponent(job.companyName)}`
              : "/offres-emploi"
          }
        />
      ))}
      {Array.from({ length: ctaCount }).map((_, index) => (
        <HomeRailCtaCard
          key={`create-job-${index}`}
          title="Créer votre offre d'emploi"
          description="Trouvez les profils qui feront avancer votre équipe."
          href="/profil/offres-emploi/nouveau"
          className="h-[132px]"
        />
      ))}
      </div>
    </section>
  );
}

function TopJobsSidebarSkeleton() {
  return (
    <section className="animate-pulse">
      <div className="mb-3 h-5 w-32 rounded-full bg-[var(--surface-4)]" />
      <div className="space-y-2">
        {Array.from({ length: OPENING_JOB_COUNT }).map((_, index) => (
          <div key={index} className="h-[52px] rounded-[10px] bg-[var(--surface-3)]" />
        ))}
      </div>
    </section>
  );
}

/** Ten compact job listings for the opportunities row on the home page. */
export const HomeTopJobsSidebar = memo(function HomeTopJobsSidebar({ initialItems }: { initialItems?: HomeJobItem[] }) {
  const [items, setItems] = useState<HomeJobItem[]>(() =>
    initialItems ? initialItems.slice(0, OPENING_JOB_COUNT) : [],
  );
  const [isLoading, setIsLoading] = useState(initialItems === undefined);
  const [ownerPlanMap, setOwnerPlanMap] = useState<Record<number, ListingOwnerPlanId>>({});
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (initialItems !== undefined) {
      return;
    }

    let isMounted = true;

    async function loadJobs() {
      try {
        const response = await fetch(`/api/public/listings/job?perPage=${HOME_JOB_REQUEST_COUNT}`, { cache: "no-store" });
        const payload = (await response.json()) as JobsApiResponse;
        if (!response.ok) {
          throw new Error("Unable to load jobs.");
        }
        if (isMounted) {
          setItems(Array.isArray(payload.items) ? payload.items.slice(0, OPENING_JOB_COUNT) : []);
        }
      } catch {
        if (isMounted) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadJobs();
    return () => { isMounted = false; };
  }, [initialItems]);

  const ownerIds = useMemo(
    () => Array.from(new Set(items.map((item) => Number(item.ownerWpUserId || 0)).filter((id) => id > 0))),
    [items],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOwnerPlans() {
      if (ownerIds.length === 0) {
        setOwnerPlanMap({});
        return;
      }

      try {
        const response = await fetch(`/api/public/listing-owner-plans?ids=${ownerIds.join(",")}`, { cache: "no-store" });
        const payload = (await response.json()) as { items?: Array<{ wpUserId?: number; planId?: unknown }> };
        if (!response.ok) throw new Error("Unable to load account plans.");
        const plans = Object.fromEntries(
          (payload.items ?? []).flatMap((entry) => {
            const id = Number(entry.wpUserId || 0);
            return id > 0 && (entry.planId === "essentiel" || entry.planId === "business") ? [[id, entry.planId]] : [];
          }),
        ) as Record<number, ListingOwnerPlanId>;
        if (!cancelled) setOwnerPlanMap(plans);
      } catch {
        if (!cancelled) setOwnerPlanMap({});
      }
    }

    void loadOwnerPlans();
    return () => { cancelled = true; };
  }, [ownerIds]);

  const jobs = useMemo(
    () => items.map((job) => {
      const companyName = job.companyName || job.publisherName || "Entreprise";
      return {
        ...job,
        companyName,
        initial: companyName.charAt(0).toUpperCase() || "E",
        accent: pickAccentColor(companyName),
      };
    }),
    [items],
  );

  useEffect(() => {
    setStartIndex(0);
    if (jobs.length <= 5) return;
    const timer = window.setInterval(() => setStartIndex((current) => (current + 1) % jobs.length), 4200);
    return () => window.clearInterval(timer);
  }, [jobs.length]);

  if (isLoading) {
    return <TopJobsSidebarSkeleton />;
  }

  if (!jobs.length) {
    return null;
  }

  const visibleJobs = Array.from(
    { length: Math.min(5, jobs.length) },
    (_, offset) => jobs[(startIndex + offset) % jobs.length],
  );

  return (
    <section className="home-four-column__jobs">
      <SectionHeading title="Top emplois" href="/offres-emploi" />
      <div className="home-four-column__scroll home-four-column__scroll--list space-y-2">
        {visibleJobs.map((job) => {
          const ownerPlanId = job.ownerWpUserId ? ownerPlanMap[job.ownerWpUserId] : undefined;
          const expiryDate = formatExpiryDate(job.expiresAt);
          return (
            <Link
            key={job.id}
            to={
              job.ownerWpUserId
                ? `/offres-emploi?ownerWpUserId=${job.ownerWpUserId}&company=${encodeURIComponent(job.companyName)}`
                : "/offres-emploi"
            }
            className="home-four-column-list-card group flex min-h-[52px] items-center gap-2.5"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-[11px] font-bold text-white" style={{ backgroundColor: job.accent }} aria-hidden="true">
              {job.initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold leading-tight text-[var(--text-main)] transition-colors group-hover:text-[#27624f]">{job.title}</span>
              <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] leading-tight text-[var(--text-soft)]">
                <span className="truncate">{job.companyName}</span>
                {ownerPlanId ? <ListingOwnerPlanBadge planId={ownerPlanId} className="h-3.5 w-3.5" /> : null}
              </span>
            </span>
            {expiryDate ? <span className="shrink-0 text-right text-[9px] font-medium leading-tight text-[#b42318]">{expiryDate}</span> : null}
          </Link>
          );
        })}
      </div>
    </section>
  );
});

type HomeDirectoryItem = {
  id: number;
  title: string;
  companyName?: string;
  category?: string;
  location?: string;
  companyLogo?: string;
  profilePhoto?: string;
};

/** Live directory entries, replacing the former generic annuary shortcut. */
export function HomeDirectorySidebar() {
  const [items, setItems] = useState<HomeDirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDirectory() {
      try {
        const response = await fetch("/api/public/listings/directory?perPage=4", { cache: "no-store" });
        const payload = (await response.json()) as { items?: HomeDirectoryItem[] };
        if (!response.ok) {
          throw new Error("Unable to load directory entries.");
        }
        if (isMounted) {
          setItems(Array.isArray(payload.items) ? payload.items.slice(0, OPENING_DIRECTORY_COUNT) : []);
        }
      } catch {
        if (isMounted) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDirectory();
    return () => { isMounted = false; };
  }, []);

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section className="mt-4">
      <SectionHeading title="Annuaires" href="/annuaire" />
      <div className="grid grid-cols-2 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[85px] animate-pulse rounded-[18px] bg-[var(--surface-3)]" />
            ))
          : items.map((entry, index) => {
              const companyName = entry.companyName || entry.title || "Entreprise";
              return (
                <CompanyCard
                  key={entry.id}
                  initial={companyName.charAt(0).toUpperCase() || "E"}
                  companyName={companyName}
                  position={entry.category || "Entreprise"}
                  location={entry.location}
                  color={pickAccentColor(companyName)}
                  logoUrl={entry.companyLogo || entry.profilePhoto}
                  compact
                  dense
                  tone={index % 2 === 0 ? "cream" : "purple"}
                  emphasizeCompany
                  href="/annuaire"
                />
              );
            })}
      </div>
    </section>
  );
}
