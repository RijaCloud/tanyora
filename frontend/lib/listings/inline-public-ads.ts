import type { PublicAdItem } from "@/lib/api/wordpress-internal";

export type ListingFeedItem<T> =
  | { kind: "listing"; item: T }
  | { kind: "advertisement"; item: PublicAdItem };

export function injectInlinePublicAds<T>(items: T[], ads: PublicAdItem[]): ListingFeedItem<T>[] {
  if (items.length === 0) {
    return [];
  }

  const sanitizedAds = ads
    .map((ad, index) => ({
      ...ad,
      position: Math.max(1, Number(ad.position || 1)),
      __index: index,
    }))
    .sort((left, right) => {
      if (left.position === right.position) {
        return left.__index - right.__index;
      }
      return left.position - right.position;
    });

  const result: ListingFeedItem<T>[] = [];
  let adCursor = 0;

  items.forEach((item, index) => {
    result.push({ kind: "listing", item });
    const itemPosition = index + 1;

    while (adCursor < sanitizedAds.length && sanitizedAds[adCursor].position === itemPosition) {
      const { __index: _ignored, ...ad } = sanitizedAds[adCursor];
      result.push({ kind: "advertisement", item: ad });
      adCursor += 1;
    }
  });

  return result;
}
