"use client";

import Link from "next/link";
import { memo, useEffect, useState } from "react";

import { SectionHeading } from "@/features/prototype/components/SectionHeading";
import { HomeRailCtaCard } from "@/features/prototype/components/HomeRailCtaCard";
import type { PublicListingItem } from "@/lib/api/wordpress-internal";

const TENDER_COUNT = 5;
const TENDER_SIDEBAR_COUNT = 10;

type TenderItem = {
  id: number;
  title: string;
  category: string;
  location: string;
  deadline: string;
  companyName: string;
};

function formatDeadline(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(parsed);
}

function TendersSkeleton() {
  return (
    <div className="mb-6 animate-pulse lg:mb-8">
      <div className="mb-3 h-5 w-48 rounded bg-[var(--surface-4)]" />
      <div className="home-browse-shelf grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: TENDER_COUNT }).map((_, index) => (
          <div key={index} className="h-[132px] rounded-[18px] bg-[var(--surface-3)]" />
        ))}
      </div>
    </div>
  );
}

/** Compact tender column for the opportunities row on the home page. */
export const HomeTendersSidebar = memo(function HomeTendersSidebar({ initialItems }: { initialItems?: PublicListingItem[] }) {
  const [tenders, setTenders] = useState<TenderItem[]>(() =>
    initialItems
      ? initialItems.slice(0, TENDER_SIDEBAR_COUNT).map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category ?? "",
          location: item.location ?? "",
          deadline: formatDeadline(item.deadline ?? ""),
          companyName: item.companyName ?? "",
        }))
      : [],
  );
  const [isLoading, setIsLoading] = useState(initialItems === undefined);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (initialItems !== undefined) {
      return;
    }

    let isMounted = true;

    async function loadTenders() {
      try {
        const response = await fetch(`/api/public/listings/tender?perPage=${TENDER_SIDEBAR_COUNT}`);
        const payload = (await response.json()) as { items?: PublicListingItem[] };
        if (!response.ok) throw new Error("Unable to load tender listings.");
        if (isMounted) {
          setTenders((Array.isArray(payload.items) ? payload.items : []).slice(0, TENDER_SIDEBAR_COUNT).map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category ?? "",
            location: item.location ?? "",
            deadline: formatDeadline(item.deadline ?? ""),
            companyName: item.companyName ?? "",
          })));
        }
      } catch {
        if (isMounted) setTenders([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTenders();
    return () => { isMounted = false; };
  }, [initialItems]);

  useEffect(() => {
    setStartIndex(0);
    if (tenders.length <= 5) return;
    const timer = window.setInterval(() => setStartIndex((current) => (current + 1) % tenders.length), 4200);
    return () => window.clearInterval(timer);
  }, [tenders.length]);

  if (isLoading) {
    return <div className="space-y-2 animate-pulse">{Array.from({ length: TENDER_SIDEBAR_COUNT }).map((_, index) => <div key={index} className="h-[52px] rounded-[10px] bg-[var(--surface-3)]" />)}</div>;
  }

  const visibleTenders = Array.from(
    { length: Math.min(5, tenders.length) },
    (_, offset) => tenders[(startIndex + offset) % tenders.length],
  );

  return (
    <section className="home-four-column__tenders">
      <SectionHeading title="Appels d'offres" href="/appels-offres" />
      <div className="home-four-column__scroll home-four-column__scroll--list space-y-2">
        {visibleTenders.map((tender) => (
          <Link key={tender.id} href={`/appels-offres/${tender.id}`} className="home-four-column-list-card group flex min-h-[52px] items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-[#fff0d6] text-[12px] font-bold text-[#c26200]" aria-hidden="true">AO</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold leading-tight text-[var(--text-main)] transition-colors group-hover:text-[#27624f]">{tender.title}</span>
              {tender.deadline ? <span className="mt-0.5 block truncate text-[10px] leading-tight text-[var(--text-soft)]">Clôture le {tender.deadline}</span> : null}
            </span>
          </Link>
        ))}
        {!tenders.length ? <HomeRailCtaCard title="Créer votre appel d'offres" description="Recevez des réponses adaptées à votre besoin." href="/profil/appels-offres/nouveau" className="h-[132px]" /> : null}
      </div>
    </section>
  );
});

export function HomeTendersSection() {
  const [tenders, setTenders] = useState<TenderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTenders() {
      try {
        const response = await fetch(`/api/public/listings/tender?perPage=${TENDER_COUNT}`);
        const payload = (await response.json()) as { items?: PublicListingItem[] };

        if (!response.ok) {
          throw new Error("Unable to load tender listings.");
        }

        const items = Array.isArray(payload.items) ? payload.items : [];

        if (isMounted) {
          setTenders(
            items.slice(0, TENDER_COUNT).map((item) => ({
              id: item.id,
              title: item.title,
              category: item.category ?? "",
              location: item.location ?? "",
              deadline: formatDeadline(item.deadline ?? ""),
              companyName: item.companyName ?? "",
            })),
          );
        }
      } catch (error) {
        console.error("[home] chargement des appels d'offres impossible", error);
        if (isMounted) {
          setTenders([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTenders();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <TendersSkeleton />;
  }

  return (
    <section className="mb-6 lg:mb-8">
      <SectionHeading title="Appels d'offres" href="/appels-offres" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tenders.map((tender) => (
          <Link
            key={tender.id}
            href={`/appels-offres/${tender.id}`}
            className="group flex flex-col gap-2 rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--surface-1)] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#27624f]/45 hover:shadow-[0_18px_35px_rgba(17,17,17,0.10)]"
          >
            {tender.category ? (
              <span className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-soft)]">
                {tender.category}
              </span>
            ) : null}

            <h3 className="line-clamp-3 text-[14px] font-semibold leading-[1.3] text-[var(--text-main)] transition-colors group-hover:text-[#27624f]">
              {tender.title}
            </h3>

            <div className="mt-auto flex flex-col gap-1 text-[11px] text-[color:var(--text-soft)]">
              {tender.companyName ? <span className="truncate">{tender.companyName}</span> : null}
              {tender.location ? <span className="truncate">{tender.location}</span> : null}
              {tender.deadline ? <span>Clôture le {tender.deadline}</span> : null}
            </div>
          </Link>
        ))}
        {tenders.length === 0 ? (
          <HomeRailCtaCard
            key="create-tender"
            title="Créer votre appel d'offres"
            description="Recevez des réponses adaptées à votre besoin."
            href="/profil/appels-offres/nouveau"
            className="h-[132px]"
          />
        ) : null}
      </div>
    </section>
  );
}
