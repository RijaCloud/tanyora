import { getPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";
import DirectoryPage from "@/features/directory/DirectoryPage";
import { mapPublicDirectoryCompany } from "@/features/directory/map-public-company";
import { DIRECTORY_DEMO_CATEGORIES, DIRECTORY_DEMO_CITIES_BY_REGION, DIRECTORY_DEMO_COMPANIES, DIRECTORY_DEMO_REGIONS } from "@/features/directory/demo-fixtures";
import {
  getWordPressLocationTerms,
  getWordPressPublicListings,
  getWordPressTaxonomyTerms,
} from "@/lib/api/wordpress-internal";
import type { PublicListingsResult } from "@/lib/api/wordpress-internal";
import { loadPublicData } from "@/lib/public-data/safe-server-data";
import { redirect } from "next/navigation";

// Public data is cached by the WordPress data layer. Keep the route dynamic so
// a cold cache never turns the Annuaire into a statically rendered empty page.
export const dynamic = "force-dynamic";
export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
type DirectorySearchParams = { demo?: string; focus?: string };

export async function generateMetadata({ searchParams }: { searchParams?: DirectorySearchParams }) {
  if (searchParams?.demo === "1") {
    return {
      title: "Annuaire de démonstration | Tanyora",
      description: "Aperçu fictif de l'annuaire des géologues, laboratoires et consultants miniers Tanyora.",
      robots: { index: false, follow: false },
    };
  }
  return getPublicPageMetadata("directory", "/annuaire", "Annuaire", "Parcourez les entreprises, services et contacts de l'annuaire.");
}

export default async function Page({ searchParams }: { searchParams?: DirectorySearchParams }) {
  if (searchParams?.focus && /^(?:demo-[a-z0-9-]+|[1-9]\d*)$/.test(searchParams.focus)) {
    redirect(`/annuaire/${encodeURIComponent(searchParams.focus)}`);
  }
  if (searchParams?.demo === "1") {
    return (
      <DirectoryPage
        companies={DIRECTORY_DEMO_COMPANIES}
        initialPagination={{ page: 1, perPage: 24, total: DIRECTORY_DEMO_COMPANIES.length, totalPages: 1 }}
        categories={DIRECTORY_DEMO_CATEGORIES}
        regions={DIRECTORY_DEMO_REGIONS}
        citiesByRegion={DIRECTORY_DEMO_CITIES_BY_REGION}
        demoMode
        availability={{ companies: true, jobs: true, categories: true, locations: true }}
      />
    );
  }

  const [directoryResult, categoryResult, locationResult] = await Promise.all([
    loadPublicData(
      () => getWordPressPublicListings("directory", { page: 1, perPage: 24 }),
      { items: [], pagination: { page: 1, perPage: 24, total: 0, totalPages: 1 } } as PublicListingsResult,
    ),
    loadPublicData(() => getWordPressTaxonomyTerms("directory"), { terms: [], productTags: [] }),
    loadPublicData(() => getWordPressLocationTerms("directory"), { terms: [] }),
  ]);

  const companies = directoryResult.data.items.map(mapPublicDirectoryCompany);
  const demoMode = process.env.DEPLOYMENT_ENV === "preview" && companies.length === 0;
  const categories = Array.from(
    new Set([
      "Tous",
      ...categoryResult.data.terms.map((term) => term.name.trim()).filter(Boolean),
    ]),
  );

  const regions = Array.from(
    new Set(
      [
        ...locationResult.data.terms
          .filter((term) => term.parentId === 0)
          .map((term) => term.name.trim())
          .filter(Boolean),
      ],
    ),
  );

  const citiesByRegion = locationResult.data.terms.reduce<Record<string, string[]>>((accumulator, term) => {
    if (!term.parentName || term.parentId === 0) {
      return accumulator;
    }

    const regionName = term.parentName.trim();
    const cityName = term.name.trim();

    if (!regionName || !cityName) {
      return accumulator;
    }

    const existingCities = accumulator[regionName] || [];
    if (!existingCities.includes(cityName)) {
      accumulator[regionName] = [...existingCities, cityName];
    }

    return accumulator;
  }, {});

  return (
    <DirectoryPage
      companies={demoMode ? DIRECTORY_DEMO_COMPANIES : companies}
      initialPagination={demoMode ? { page: 1, perPage: 24, total: DIRECTORY_DEMO_COMPANIES.length, totalPages: 1 } : directoryResult.data.pagination}
      categories={demoMode ? DIRECTORY_DEMO_CATEGORIES : categories}
      regions={demoMode ? DIRECTORY_DEMO_REGIONS : regions}
      citiesByRegion={demoMode ? DIRECTORY_DEMO_CITIES_BY_REGION : citiesByRegion}
      demoMode={demoMode}
      demoBackendUnavailable={demoMode && !directoryResult.available}
      availability={{
        companies: demoMode || directoryResult.available,
        jobs: true,
        categories: demoMode || categoryResult.available,
        locations: demoMode || locationResult.available,
      }}
    />
  );
}
