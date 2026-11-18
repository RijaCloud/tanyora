"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Search, Tag } from "lucide-react";
import { PublicUnavailableState } from "@/components/errors/PublicUnavailableState";
import PublicAdBannerRow from "@/features/prototype/components/PublicAdBannerRow";
import PublicListPagination from "@/features/prototype/components/PublicListPagination";
import {
  readPublicListPageFromUrl,
  updatePublicListQueryParams,
} from "@/lib/listings/public-list-page";
import SponsoredSlider from "@/features/prototype/components/SponsoredSlider";
import type { DirectoryCompany } from "@/features/directory/types";
import { trackFilterApplied, trackSearchSubmitted } from "@/lib/analytics/ga4";

type DirectoryPageProps = {
  companies: DirectoryCompany[];
  initialPagination: { page: number; perPage: number; total: number; totalPages: number };
  categories: readonly string[];
  regions: readonly string[];
  citiesByRegion: Record<string, string[]>;
  demoMode?: boolean;
  demoBackendUnavailable?: boolean;
  availability?: {
    companies: boolean;
    categories: boolean;
    locations: boolean;
    jobs: boolean;
  };
};

const DIRECTORY_PAGE_SIZE = 24;
const DIRECTORY_FILTER_VISIBLE_COUNT = 6;

type DirectoryApiResponse = {
  items: Array<Record<string, unknown>>;
  pagination: { page: number; perPage: number; total: number; totalPages: number };
};

function getDirectoryColor(index: number) {
  const palette = ["#27624f", "#111111", "#2563EB", "#14B8A6", "#F59E0B", "#8B5CF6", "#16A34A", "#EA580C"];
  return palette[index % palette.length];
}

function toDirectoryCompanies(items: Array<Record<string, unknown>>): DirectoryCompany[] {
  return items.map((item, index) => {
    const name = String(item.companyName || item.title || "").trim();
    const featuredImage = typeof item.image === "string" && item.image.trim() ? item.image : null;
    return {
      id: String(item.id || ""),
      name,
      initial: name.charAt(0).toUpperCase() || "A",
      color: getDirectoryColor(index),
      location: String(item.location || "Madagascar"),
      regions: Array.isArray(item.regions) ? item.regions.map(String).filter(Boolean) : [],
      cities: Array.isArray(item.cities) ? item.cities.map(String).filter(Boolean) : [],
      industry: String(item.category || "Services"),
      description: String(item.description || item.content || "").trim(),
      phone: String(item.contactPhone || "Non communique"),
      email: String(item.contactEmail || "Non communique"),
      website: typeof item.website === "string" && item.website ? item.website : undefined,
      featured: Boolean(item.featured),
      imageUrl:
        featuredImage ||
        (typeof item.companyLogo === "string" && item.companyLogo
          ? item.companyLogo
          : item.hasProfilePhoto === true && typeof item.profilePhoto === "string" && item.profilePhoto
            ? item.profilePhoto
            : null),
      ownerWpUserId: Number(item.ownerWpUserId) > 0 ? Number(item.ownerWpUserId) : undefined,
    };
  });
}

function DirectoryHeroCard() {
  return (
    <div className="relative h-[240px] w-[min(280px,82vw)] shrink-0 overflow-hidden rounded-[12px] bg-[#15181d] sm:w-[180px]">
      <img
        src="/prototype-assets/47b7587af10d29e7ce1f438f34a26475dd52c698.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,28,45,0.08)_20%,rgba(5,15,25,0.88)_100%)]" />
      <div className="relative flex h-full flex-col justify-end p-[15px]">
        <div className="flex flex-col gap-[8px]">
          <p className="text-[20px] font-bold leading-[1.2] text-white">Annuaire</p>
          <p className="text-[12px] font-medium leading-[1.4] text-[#b2b2b2]">
            Entreprises, services et contacts utiles.
          </p>
        </div>
      </div>
    </div>
  );
}

function DirectoryCard({
  company,
  demoMode = false,
}: {
  company: DirectoryCompany;
  demoMode?: boolean;
}) {
  return (
    <Link
      href={`/annuaire/${encodeURIComponent(company.id)}${demoMode ? "?demo=1" : ""}`}
      className="group ui-surface relative h-[240px] w-full min-w-0 cursor-pointer overflow-hidden rounded-[12px] text-left prototype-listing-card transition-colors duration-300 md:basis-[calc(50%-7px)] md:max-w-[calc(50%-7px)] lg:w-[180px] lg:max-w-[180px] lg:basis-[180px] lg:shrink-0"
    >
      <div aria-hidden="true" className="ui-border absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />

      <div className="flex h-full flex-col gap-[10px] p-[5px]">
        <div className="relative h-[120px] w-full shrink-0 overflow-hidden rounded-[6px]">
          {company.imageUrl ? (
            <img
              src={company.imageUrl}
              alt={company.name}
              className="absolute inset-0 h-full w-full rounded-[6px] object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center rounded-[6px] bg-[linear-gradient(135deg,#111111,#4b5563)]">
              <span className="text-5xl font-semibold text-white">{company.initial}</span>
            </div>
          )}

          {company.featured ? (
            <div className="absolute right-[10px] top-[10px] rounded-[8px] bg-black/35 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              SPONSORISÉE
            </div>
          ) : null}
        </div>

        <div className="relative flex min-h-0 flex-1 overflow-hidden px-[14px] pb-[14px]">
          <div className="flex w-full min-w-0 items-start">
            <div className="relative flex min-h-0 min-w-0 flex-[1_0_0] flex-col items-start gap-[6px] overflow-hidden">
              <div className="ui-text-main flex w-full flex-col justify-center overflow-hidden text-[14px] font-bold">
                <p className="line-clamp-2 break-words leading-[1.18]">{company.name}</p>
              </div>
              <div className="flex w-full min-h-0 flex-col overflow-hidden text-[11px] font-bold uppercase tracking-[0.12em] text-[#27624f]">
                <p className="line-clamp-2 break-words leading-[1.2]">{company.industry}</p>
              </div>
              <div className="ui-text-soft w-full line-clamp-1 break-words text-[11px] leading-[1.45] [overflow-wrap:anywhere]">
                {company.location}
              </div>
              {company.description ? (
                <div className="ui-text-muted mt-1 line-clamp-1 text-[11px] leading-[1.45]">{company.description}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FilterOption({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className="tanyora-filter-choice group relative w-full rounded-md px-2 py-1.5 text-left transition-all duration-200 ease-in-out"
    >
      <div className="relative w-full">
        <div className="flex items-start pl-[25px] pt-[2px]">
          <div
            className={`text-[12px] leading-[1.4] transition-colors duration-200 ease-in-out ${
              isActive ? "font-medium text-[#171717] dark:text-white" : "text-[#171717] dark:text-gray-300 group-hover:text-[#27624f]"
            }`}
          >
            <p className="break-words whitespace-normal">{label}</p>
          </div>
        </div>
        <div className="absolute left-0 top-[2.49px] h-[16px] w-[16px] transition-all duration-200 ease-in-out">
          <div
            className={`absolute left-0 top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-[16px] border border-solid transition-colors duration-200 ease-in-out ${
              isActive
                ? "border-[#27624f] bg-white dark:bg-[#2a2a2a]"
                : "border-[#a3a3a3] bg-white group-hover:border-[#27624f] dark:border-[#5a5a5a] dark:bg-[#2a2a2a]"
            }`}
          />
          {isActive ? <div className="absolute left-[3px] top-[2.94px] h-[10px] w-[10px] rounded-[10px] bg-[#27624f]" /> : null}
        </div>
      </div>
    </button>
  );
}

function MultiFilterOption({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className="tanyora-filter-choice group relative w-full rounded-md px-2 py-1.5 text-left transition-all duration-200 ease-in-out"
    >
      <div className="relative w-full">
        <div className="flex items-start pl-[25px] pt-[2px]">
          <div
            className={`text-[12px] leading-[1.4] transition-colors duration-200 ease-in-out ${
              isActive ? "font-medium text-[#171717] dark:text-white" : "text-[#171717] dark:text-gray-300 group-hover:text-[#27624f]"
            }`}
          >
            <p className="overflow-hidden text-ellipsis whitespace-nowrap">{label}</p>
          </div>
        </div>
        <div className="absolute left-0 top-[2.49px] flex h-[16px] w-[16px] items-center justify-center transition-all duration-200 ease-in-out">
          <div
            className={`absolute left-0 top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-[4px] border border-solid transition-colors duration-200 ease-in-out ${
              isActive
                ? "border-[#27624f] bg-[#fff1f2] dark:bg-[#3a1013]"
                : "border-[#a3a3a3] bg-white group-hover:border-[#27624f] dark:border-[#5a5a5a] dark:bg-[#2a2a2a]"
            }`}
          />
          {isActive ? (
            <svg className="relative z-[1] h-[10px] w-[10px] text-[#27624f]" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5 6.5 11.5 12.5 4.5" />
            </svg>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function FilterSection({
  title,
  icon,
  isOpen,
  onToggle,
  alwaysOpen = false,
  children,
}: {
  title: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  alwaysOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="directory-filter-section relative w-full shrink-0 border-t border-[#e8e8e8] pb-[12px] pt-2 dark:border-[#3a3a3a]">
      <button
        type="button"
        onClick={() => {
          if (!alwaysOpen) onToggle();
        }}
        tabIndex={alwaysOpen ? -1 : undefined}
        className={`relative flex w-full flex-col items-start px-[10px] pb-[4px] pt-[2px] transition-colors ${
          alwaysOpen
            ? "cursor-default hover:!bg-transparent hover:!text-[#191919] dark:hover:!text-white"
            : "hover:bg-[var(--hover-surface)]"
        }`}
      >
        <div className="relative h-[32px] w-full">
          <div className="flex h-full items-center gap-[5px]">
            <div className="flex min-h-px min-w-px flex-[1_0_0] items-center">
              <div className="flex items-center gap-1.5 text-[11px] font-bold leading-[1.2] text-[#191919] dark:text-white">
                <span className="tanyora-filter-section-icon">{icon}</span>
                <p className="tanyora-filter-section-title leading-[1.2]">{title}</p>
              </div>
            </div>
            {!alwaysOpen ? (
              <svg className={`ui-motion-transform h-[10px] w-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 10 10">
                <path d="M5 7.6L1.4 3.6h7.2L5 7.6Z" fill="#474747" className="dark:fill-gray-300" />
              </svg>
            ) : null}
          </div>
        </div>
      </button>

      {isOpen ? (
        <div className="ui-motion-panel relative w-full overflow-hidden transition-all">
          <div className="flex w-full flex-col items-start px-[10px] pb-[10px] pr-[15px]">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

function SelectionChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-[#27624f]/25 bg-[#fff1f2] px-3 py-1 text-[11px] font-medium text-[#27624f] transition hover:border-[#27624f] dark:bg-[#3a1013] dark:text-[#ffb5b8]"
    >
      <span>{label}</span>
      <span aria-hidden="true" className="text-[13px] leading-none">
        ×
      </span>
    </button>
  );
}

function FilterListToggle({
  isExpanded,
  onClick,
}: {
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 self-start rounded-full px-2 py-1 text-[11px] font-medium text-[#5d5d64] transition-colors hover:text-[#27624f] dark:text-[#b4b4bb] dark:hover:text-white"
    >
      <span>{isExpanded ? "Voir moins" : "Voir plus"}</span>
      <svg
        className={`h-[10px] w-[10px] transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 10 10"
        aria-hidden="true"
      >
        <path d="M5 7.5L1.25 3.75H8.75L5 7.5Z" fill="currentColor" />
      </svg>
    </button>
  );
}

export function DirectoryPage({ companies: initialCompanies, initialPagination, categories, regions, citiesByRegion, availability, demoMode = false, demoBackendUnavailable = false }: DirectoryPageProps) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionQuery, setRegionQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [isCitySuggestionsOpen, setIsCitySuggestionsOpen] = useState(false);
  const [activeFilterAccordion, setActiveFilterAccordion] = useState<"categories" | "regions" | "cities" | null>("categories");
  const [currentPage, setCurrentPage] = useState(() => readPublicListPageFromUrl());
  const [companies, setCompanies] = useState(initialCompanies);
  const [featuredCompaniesSource, setFeaturedCompaniesSource] = useState(() => initialCompanies.filter((company) => company.featured));
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [isDesktopFilters, setIsDesktopFilters] = useState(false);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  // The first page is already rendered by the server. Fetch only after a real
  // filter or pagination change, so opening the directory makes one request.
  const loadedRequestKeyRef = useRef(`page=1&perPage=${DIRECTORY_PAGE_SIZE}`);

  useEffect(() => {
    const syncViewport = () => {
      const isDesktop = window.innerWidth >= 1024;
      setIsDesktopFilters(isDesktop);

      if (isDesktop) {
        setIsMobileFiltersVisible(false);
      }
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    const categoryFromUrl = searchParams?.get("category")?.trim();
    setSelectedCategory(categoryFromUrl && categories.includes(categoryFromUrl) ? categoryFromUrl : "Tous");
    setCurrentPage(readPublicListPageFromUrl());
  }, [categories, searchParams]);

  // Sponsored entries have their own unfiltered source. A category, location,
  // or search filter only applies to the directory results below the rail.
  const featuredCompanies = useMemo(() => featuredCompaniesSource.filter((company) => company.featured), [featuredCompaniesSource]);
  const normalizedRegionQuery = regionQuery.trim().toLowerCase();
  const normalizedCityQuery = cityQuery.trim().toLowerCase();
  const categoryFilters = useMemo(() => categories.filter((category) => category !== "Tous"), [categories]);
  const hasDirectoryFilters = selectedCategory !== "Tous" || selectedRegions.length > 0 || selectedCities.length > 0 || searchQuery.trim() !== "";
  const selectedCategoryIndex = categoryFilters.indexOf(selectedCategory);
  const shouldExpandCategories = showAllCategories || selectedCategoryIndex >= DIRECTORY_FILTER_VISIBLE_COUNT;
  const visibleCategories = shouldExpandCategories ? categoryFilters : categoryFilters.slice(0, DIRECTORY_FILTER_VISIBLE_COUNT);
  const filteredRegions = useMemo(
    () => regions.filter((region) => region.toLowerCase().includes(normalizedRegionQuery)),
    [normalizedRegionQuery, regions],
  );
  const selectedRegionIndex = filteredRegions.findIndex((region) => selectedRegions.includes(region));
  const shouldExpandRegions = normalizedRegionQuery !== "" || showAllRegions || selectedRegionIndex >= DIRECTORY_FILTER_VISIBLE_COUNT;
  const visibleRegions = shouldExpandRegions ? filteredRegions : filteredRegions.slice(0, DIRECTORY_FILTER_VISIBLE_COUNT);

  const availableCities = useMemo(() => {
    const scopedCities =
      selectedRegions.length > 0
        ? selectedRegions.flatMap((region) => citiesByRegion[region] || [])
        : Object.values(citiesByRegion).flat();

    return Array.from(new Set(scopedCities.filter(Boolean)));
  }, [citiesByRegion, selectedRegions]);

  const matchingCities = useMemo(() => {
    if (selectedRegions.length === 0) {
      return [];
    }

    if (!normalizedCityQuery) {
      return availableCities.filter((city) => !selectedCities.includes(city)).slice(0, 8);
    }

    return availableCities
      .filter((city) => city.toLowerCase().includes(normalizedCityQuery) && !selectedCities.includes(city))
      .slice(0, 8);
  }, [availableCities, normalizedCityQuery, selectedCities, selectedRegions.length]);

  const demoCompanies = useMemo(() => {
    if (!demoMode) return [];
    const query = deferredSearchQuery.toLocaleLowerCase("fr");
    return initialCompanies.filter((company) =>
      (selectedCategory === "Tous" || company.industry === selectedCategory) &&
      (selectedRegions.length === 0 || company.regions.some((region) => selectedRegions.includes(region))) &&
      (selectedCities.length === 0 || company.cities.some((city) => selectedCities.includes(city))) &&
      (!query || `${company.name} ${company.industry} ${company.location} ${company.description}`.toLocaleLowerCase("fr").includes(query)),
    );
  }, [demoMode, initialCompanies, selectedCategory, selectedRegions, selectedCities, deferredSearchQuery]);
  const totalPages = demoMode ? 1 : Math.max(1, pagination.totalPages);
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedCompanies = demoMode ? demoCompanies : companies;

  const directoryRequestKey = useMemo(() => {
    const params = new URLSearchParams({ page: String(currentPage), perPage: String(DIRECTORY_PAGE_SIZE) });
    if (selectedCategory !== "Tous") params.set("category", selectedCategory);
    if (deferredSearchQuery) params.set("search", deferredSearchQuery);
    selectedRegions.forEach((region) => params.append("region", region));
    selectedCities.forEach((city) => params.append("city", city));
    return params.toString();
  }, [currentPage, deferredSearchQuery, selectedCategory, selectedRegions, selectedCities]);

  useEffect(() => {
    if (demoMode) return;
    if (loadedRequestKeyRef.current === directoryRequestKey) {
      return;
    }

    const controller = new AbortController();
    loadedRequestKeyRef.current = directoryRequestKey;

    setIsLoadingCompanies(true);
    setCompaniesError("");
    fetch(`/api/public/directory?${directoryRequestKey}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as DirectoryApiResponse & { error?: string };
        if (!response.ok) throw new Error(body.error || "L'annuaire est temporairement indisponible.");
        return body;
      })
      .then((body) => {
        setCompanies(toDirectoryCompanies(body.items));
        setPagination(body.pagination);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        loadedRequestKeyRef.current = "";
        setCompaniesError(error instanceof Error ? error.message : "L'annuaire est temporairement indisponible.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingCompanies(false);
      });

    return () => controller.abort();
  }, [demoMode, directoryRequestKey]);

  useEffect(() => {
    if (demoMode) return;
    let cancelled = false;

    async function loadFeaturedCompanies() {
      try {
        const response = await fetch(`/api/public/directory?perPage=50&featured=true`, { cache: "no-store" });
        const body = (await response.json()) as DirectoryApiResponse;
        if (!cancelled && response.ok && Array.isArray(body.items)) {
          setFeaturedCompaniesSource(toDirectoryCompanies(body.items));
        }
      } catch {
        // Keep server-rendered sponsored entries available if this refresh fails.
      }
    }

    void loadFeaturedCompanies();
    return () => {
      cancelled = true;
    };
  }, [demoMode]);

  const isCategoriesOpen = activeFilterAccordion === "categories";
  const isRegionsOpen = activeFilterAccordion === "regions";
  const isCitiesOpen = activeFilterAccordion === "cities";

  const toggleFilterAccordion = (accordion: "categories" | "regions" | "cities") => {
    setActiveFilterAccordion((current) => (current === accordion ? null : accordion));
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
    updatePublicListQueryParams({ page: null, focus: null }, true);
  };

  const handleCategoryChange = (category: string) => {
    trackFilterApplied("directory", "category");
    setSelectedCategory(category);
    setCurrentPage(1);
    updatePublicListQueryParams({
      category: category === "Tous" ? null : category,
      page: null,
      focus: null,
    });
  };

  const clearDirectoryFilters = () => {
    setSelectedCategory("Tous");
    setSelectedRegions([]);
    setSelectedCities([]);
    setSearchQuery("");
    setRegionQuery("");
    setCityQuery("");
    setIsCitySuggestionsOpen(false);
    resetToFirstPage();
    updatePublicListQueryParams({ category: null, page: null, focus: null });
  };

  const toggleRegion = (region: string) => {
    trackFilterApplied("directory", "location");
    setSelectedRegions((current) => {
      if (current.includes(region)) {
        return current.filter((value) => value !== region);
      }
      return [...current, region];
    });
    resetToFirstPage();
  };

  const toggleCity = (city: string) => {
    trackFilterApplied("directory", "location");
    setSelectedCities((current) => {
      if (current.includes(city)) {
        return current.filter((value) => value !== city);
      }
      return [...current, city];
    });
    setCityQuery("");
    setIsCitySuggestionsOpen(false);
    resetToFirstPage();
  };

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === visiblePage) {
      return;
    }

    setCurrentPage(nextPage);
    updatePublicListQueryParams({
      page: nextPage > 1 ? nextPage : null,
      focus: null,
    }, false);
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      updatePublicListQueryParams({
        page: totalPages > 1 ? totalPages : null,
        focus: null,
      }, true);
    }
  }, [currentPage, totalPages]);


  useEffect(() => {
    setSelectedCities((current) => current.filter((city) => availableCities.includes(city)));
  }, [availableCities]);


  return (
    <div className="directory-listing-page relative min-h-screen w-full bg-white pb-[50px] font-['Roboto_Flex',sans-serif] text-[#111111] dark:bg-[var(--page-bg)] dark:text-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-4 sm:px-6 lg:px-8">
        <header className="tanyora-catalogue-intro">
          <div>
            <span className="tanyora-catalogue-index">TANYORA / COMMUNAUTÉ 02</span>
            <h1>Les visages de la collection</h1>
          </div>
          <p>Géologues, laboratoires et consultants du secteur minier à Madagascar.</p>
        </header>
        {demoMode ? (
          <div role="note" className="mt-5 w-full rounded-[12px] border border-[#b68a54]/50 bg-[#f7f3ea] px-4 py-3 text-[13px] leading-5 text-[#3c493b]">
            <strong>Démonstration.</strong> {demoBackendUnavailable ? "L'annuaire réel est momentanément indisponible. " : ""}Ces profils sont fictifs et ne représentent pas des partenaires ou des professionnels vérifiés. Aucune prise de contact n'est possible.
          </div>
        ) : null}
        {featuredCompanies.length > 0 ? (
          <div className="relative flex w-full shrink-0 flex-col items-end gap-[16px] pt-[20px]">
            <div className="inline-flex shrink-0 items-center justify-center self-end rounded-[12px] border border-[#27624f] bg-[#fff1f2] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#27624f]">
              SPONSORISÉES
            </div>

            <SponsoredSlider
              className="directory-sponsored-slider"
              leading={<DirectoryHeroCard />}
              leadingClassName="hidden lg:block"
              items={featuredCompanies}
              renderItem={(company) => (
                <div className="w-[min(280px,82vw)] shrink-0 sm:w-[180px]">
                  <DirectoryCard company={company} demoMode={demoMode} />
                </div>
              )}
            />
          </div>
        ) : null}

        {!demoMode ? <PublicAdBannerRow placement="boost_list" /> : null}

        <div className="relative flex w-full shrink-0 flex-col items-start gap-[14px] pt-[32px] lg:flex-row">
          <div className={`${isDesktopFilters || isMobileFiltersVisible ? "flex" : "hidden"} listing-filter-panel tanyora-marketplace-filters prototype-listing-sidebar content-stretch relative w-full shrink-0 flex-col items-start lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:flex lg:w-[264px]`}>
            <div className="relative w-full">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[12px] border-r border-solid border-[#e8e8e8] dark:border-[#3a3a3a]" />
              <header className="tanyora-filter-heading hidden lg:flex">
                <strong>Filtres</strong>
                {hasDirectoryFilters ? <button type="button" onClick={clearDirectoryFilters}>Tout effacer</button> : null}
              </header>
              <div className="flex w-full flex-col items-start">
                {!isDesktopFilters ? (
                  <div className="flex w-full items-center justify-between border-b border-[#e8e8e8] px-[12px] py-[12px] dark:border-[#3a3a3a] lg:hidden">
                    <p className="text-[12px] font-bold text-[#191919] dark:text-white">Filtres</p>
                    {hasDirectoryFilters ? <button type="button" onClick={clearDirectoryFilters} className="tanyora-filter-reset">Tout effacer</button> : null}
                    <button
                      type="button"
                      onClick={() => setIsMobileFiltersVisible(false)}
                      className="rounded-full border border-[#d8d8dc] px-3 py-1 text-[11px] font-semibold text-[#191919] dark:border-[#4a4a52] dark:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                ) : null}
                <div className="tanyora-search-filter relative w-full px-2 pb-[8px] pt-[8px]">
                  <p className="text-[12px] font-bold leading-[1.2] text-[#191919] dark:text-white">Recherche</p>
                  <label className="public-listing-text-filter ui-border-strong ui-surface ui-text-main mt-2 flex h-[34px] w-full items-center gap-2 rounded-[10px] border px-2.5">
                    <Search className="size-4 shrink-0 text-[#707070] dark:text-gray-400" strokeWidth={1.5} aria-hidden="true" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        resetToFirstPage();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && searchQuery.trim()) {
                          trackSearchSubmitted("directory");
                        }
                      }}
                      placeholder="Recherche"
                      aria-label="Rechercher dans l'annuaire"
                      className="public-listing-text-filter-input h-full min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#8c8c93] dark:placeholder:text-[#8a8a94]"
                    />
                  </label>
                </div>

                <FilterSection
                  title="Catégories"
                  icon={<Tag className="h-3.5 w-3.5 text-[#27624f]" strokeWidth={1.8} aria-hidden="true" />}
                  isOpen={isDesktopFilters || isCategoriesOpen}
                  alwaysOpen={isDesktopFilters}
                  onToggle={() => toggleFilterAccordion("categories")}
                >
                  {availability && !availability.categories ? (
                    <p className="ui-text-muted py-2 text-[11px] leading-[1.5]">Les catégories ne sont pas disponibles pour le moment.</p>
                  ) : null}
                  <div className="flex w-full flex-col gap-[6px] py-[6px]">
                    <FilterOption
                      label="Tous"
                      isActive={selectedCategory === "Tous"}
                      onClick={() => handleCategoryChange("Tous")}
                    />
                    {visibleCategories.map((category) => (
                      <FilterOption
                        key={category}
                        label={category}
                        isActive={selectedCategory === category}
                        onClick={() => handleCategoryChange(category)}
                      />
                    ))}
                    {categoryFilters.length > DIRECTORY_FILTER_VISIBLE_COUNT ? (
                      <FilterListToggle isExpanded={shouldExpandCategories} onClick={() => setShowAllCategories((current) => !current)} />
                    ) : null}
                  </div>
                </FilterSection>

                <FilterSection
                  title="Localisation"
                  icon={<MapPin className="h-3.5 w-3.5 text-[#27624f]" strokeWidth={1.8} aria-hidden="true" />}
                  isOpen={isDesktopFilters || isRegionsOpen}
                  alwaysOpen={isDesktopFilters}
                  onToggle={() => toggleFilterAccordion("regions")}
                >
                  {availability && !availability.locations ? (
                    <p className="ui-text-muted py-2 text-[11px] leading-[1.5]">Les localisations ne sont pas disponibles pour le moment.</p>
                  ) : null}
                  <div className="flex w-full flex-col gap-[6px] py-[6px]">
                    <div className="public-listing-text-filter ui-border-strong ui-surface ui-text-main flex h-[34px] items-center gap-2 rounded-[10px] border px-2.5">
                      <Search className="size-4 shrink-0 text-[#707070] dark:text-gray-400" strokeWidth={1.5} aria-hidden="true" />
                      <input
                        type="search"
                        value={regionQuery}
                        onChange={(event) => setRegionQuery(event.target.value)}
                        placeholder="Rechercher une région"
                        aria-label="Rechercher une région"
                        className="public-listing-text-filter-input h-full min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#8c8c93] dark:placeholder:text-[#8a8a94]"
                      />
                    </div>
                    <FilterOption
                      label="Toutes"
                      isActive={selectedRegions.length === 0 && selectedCities.length === 0}
                      onClick={() => {
                        setSelectedRegions([]);
                        setSelectedCities([]);
                        resetToFirstPage();
                      }}
                    />
                    {filteredRegions.length > 0 ? (
                      visibleRegions.map((region) => (
                        <MultiFilterOption
                          key={region}
                          label={region}
                          isActive={selectedRegions.includes(region)}
                          onClick={() => toggleRegion(region)}
                        />
                      ))
                    ) : (
                      <p className="ui-text-muted text-[11px] leading-[1.5]">
                        {normalizedRegionQuery ? "Aucune région ne correspond à cette recherche." : "Aucune région disponible."}
                      </p>
                    )}
                    {!normalizedRegionQuery && filteredRegions.length > DIRECTORY_FILTER_VISIBLE_COUNT ? (
                      <FilterListToggle isExpanded={shouldExpandRegions} onClick={() => setShowAllRegions((current) => !current)} />
                    ) : null}
                  </div>
                </FilterSection>

                <FilterSection
                  title="Villes"
                  icon={<MapPin className="h-3.5 w-3.5 text-[#27624f]" strokeWidth={1.8} aria-hidden="true" />}
                  isOpen={isDesktopFilters || isCitiesOpen}
                  alwaysOpen={isDesktopFilters}
                  onToggle={() => toggleFilterAccordion("cities")}
                >
                  {availability && !availability.locations ? (
                    <p className="ui-text-muted py-2 text-[11px] leading-[1.5]">La recherche par ville est indisponible pour le moment.</p>
                  ) : null}
                  <div className="flex w-full flex-col gap-[10px] py-[6px]">
                    <div
                      className={`public-listing-text-filter ui-border-strong ui-surface ui-text-main relative flex h-[34px] items-center gap-2 rounded-[10px] border px-2.5 ${
                        selectedRegions.length === 0 ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    >
                      <Search className="size-4 shrink-0 text-[#707070] dark:text-gray-400" strokeWidth={1.5} aria-hidden="true" />
                      <input
                        type="text"
                        value={cityQuery}
                        onChange={(event) => {
                          setCityQuery(event.target.value);
                          setIsCitySuggestionsOpen(true);
                        }}
                        onFocus={() => setIsCitySuggestionsOpen(true)}
                        onBlur={() => {
                          window.setTimeout(() => setIsCitySuggestionsOpen(false), 120);
                        }}
                        disabled={selectedRegions.length === 0}
                        placeholder={selectedRegions.length > 0 ? "Rechercher une ville" : "Sélectionnez une région"}
                        className="public-listing-text-filter-input h-full min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#8c8c93] disabled:cursor-not-allowed dark:placeholder:text-[#8a8a94]"
                      />

                      {cityQuery ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCityQuery("");
                            setIsCitySuggestionsOpen(false);
                          }}
                          className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#7c7c7c] transition hover:bg-black/5 hover:text-[#27624f] dark:hover:bg-white/5"
                          aria-label="Effacer la recherche de ville"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12" />
                          </svg>
                        </button>
                      ) : null}
                    </div>

                    {selectedCities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedCities.map((city) => (
                          <SelectionChip key={city} label={city} onRemove={() => toggleCity(city)} />
                        ))}
                      </div>
                    ) : null}

                    {selectedRegions.length === 0 ? (
                      <p className="ui-text-muted text-[11px] leading-[1.5]">
                        Sélectionnez une ou plusieurs régions pour afficher leurs villes.
                      </p>
                    ) : availableCities.length > 0 && !cityQuery ? (
                      <div className="flex w-full flex-col gap-[6px]">
                        {availableCities.map((city) => (
                          <MultiFilterOption
                            key={city}
                            label={city}
                            isActive={selectedCities.includes(city)}
                            onClick={() => toggleCity(city)}
                          />
                        ))}
                      </div>
                    ) : null}

                    {isCitySuggestionsOpen && matchingCities.length > 0 ? (
                      <div className="ui-surface ui-border overflow-hidden rounded-[12px] border">
                        <div className="max-h-[240px] overflow-y-auto py-1">
                          {matchingCities.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                toggleCity(city);
                              }}
                              className="ui-text-main w-full px-3 py-2 text-left text-[13px] transition hover:bg-gray-100 dark:hover:bg-[#3a3a3a]"
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedRegions.length > 0 ? (
                      <p className="ui-text-muted text-[11px] leading-[1.5]">
                        Affinez votre recherche en sélectionnant une ou plusieurs villes.
                      </p>
                    ) : null}
                  </div>
                </FilterSection>
              </div>
            </div>
          </div>

          <div className="content-stretch relative flex min-w-0 flex-1 flex-col items-start gap-[24px] self-stretch">
            <div className="listing-results-toolbar content-stretch relative flex w-full min-w-0 shrink-0 flex-col items-start justify-between gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              {!isDesktopFilters ? (
                <div className="w-full lg:hidden">
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersVisible((current) => !current)}
                    className="ui-surface ui-border ui-text-main inline-flex items-center gap-2 rounded-[12px] border px-4 py-2 text-[12px] font-semibold"
                    aria-expanded={isMobileFiltersVisible}
                  >
                    {isMobileFiltersVisible ? "Masquer les filtres" : "Afficher les filtres"}
                  </button>
                </div>
              ) : null}
              <div className="ui-text-main flex flex-col justify-center text-[12px] font-semibold leading-[1.4]">
                <p>
                  <span className="font-semibold">RÉSULTATS </span>
              <span className="font-normal">({demoMode ? demoCompanies.length : pagination.total})</span>
                </p>
              </div>
            </div>

            {availability && !availability.companies ? (
              <PublicUnavailableState
                compact
                title="L'annuaire est temporairement indisponible"
                description="Les autres services de Tanyora restent disponibles. Réessayez dans quelques instants."
                backHref="/"
              />
            ) : companiesError ? (
              <PublicUnavailableState compact title="L'annuaire est temporairement indisponible" description={companiesError} backHref="/" />
            ) : paginatedCompanies.length > 0 ? (
              <>
                <div className="flex w-full flex-wrap items-start gap-[14px]">
                  {paginatedCompanies.map((company) => (
                    <DirectoryCard key={company.id} company={company} demoMode={demoMode} />
                  ))}
                </div>
                <PublicListPagination
                  currentPage={visiblePage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
                {isLoadingCompanies ? <p className="ui-text-muted text-[12px]">Mise à jour des résultats…</p> : null}
              </>
            ) : (
              <div className="ui-card-flat ui-border w-full rounded-[20px] border px-5 py-6">
                <p className="ui-text-main text-[14px] font-semibold">Aucune entreprise ne correspond à ces filtres.</p>
                <p className="ui-text-muted mt-2 text-[13px] leading-[1.6]">
                  Essayez une autre catégorie, une autre région ou retirez quelques villes pour élargir la recherche.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default DirectoryPage;
