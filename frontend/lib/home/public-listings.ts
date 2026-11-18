import "server-only";

import {
  getWordPressPublicListings,
  type PublicListingItem,
} from "@/lib/api/wordpress-internal";

export type HomePublicListings = {
  classifieds: PublicListingItem[];
  jobs: PublicListingItem[];
  tenders: PublicListingItem[];
};

const HOME_CLASSIFIED_COUNT = 6;
const HOME_JOB_COUNT = 15;
const HOME_TENDER_COUNT = 10;

function parseListingDate(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return Number.NaN;

  const parsed = new Date(raw).getTime();
  if (Number.isFinite(parsed)) return parsed;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!slashMatch) return Number.NaN;

  const [, day, month, year] = slashMatch;
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
}

function toBrowserSafeItems(items: PublicListingItem[]) {
  return items.map(({ ownerEmail: _ownerEmail, ...item }) => item);
}

function getActiveTenders(items: PublicListingItem[]) {
  return items
    .filter((item) => {
      const tender = item as PublicListingItem & { isExpired?: boolean };
      if (tender.isExpired) return false;

      const expiresAt = parseListingDate(item.expiresAt);
      return !Number.isFinite(expiresAt) || expiresAt >= Date.now();
    })
    .sort((left, right) => {
      const leftDate = parseListingDate(left.date);
      const rightDate = parseListingDate(right.date);
      return (Number.isFinite(rightDate) ? rightDate : 0) - (Number.isFinite(leftDate) ? leftDate : 0);
    });
}

/**
 * The individual listing reads already use the shared Redis-backed public
 * cache. Keeping this aggregation cache-free lets existing listing mutations
 * invalidate the home page without a second cache namespace to maintain.
 */
export async function getHomePublicListings(): Promise<HomePublicListings> {
  const [classifieds, jobs, tenders] = await Promise.all([
    getWordPressPublicListings("classified", { page: 1, perPage: HOME_CLASSIFIED_COUNT }),
    getWordPressPublicListings("job", { page: 1, perPage: HOME_JOB_COUNT }),
    getWordPressPublicListings("tender", { page: 1, perPage: HOME_TENDER_COUNT }),
  ]);

  return {
    classifieds: toBrowserSafeItems(classifieds.items),
    jobs: toBrowserSafeItems(jobs.items),
    tenders: toBrowserSafeItems(getActiveTenders(tenders.items)),
  };
}
