import { describe, expect, it } from "vitest";

import {
  buildRevalidatePaths,
  isListingBoostEvent,
  resolvePublicCacheKinds,
} from "@/lib/wp/revalidate";

describe("listing boost revalidation", () => {
  const payload = {
    event: "listing.boosted" as const,
    postType: "classified_ad",
  };

  it("recognizes a dedicated boost event", () => {
    expect(isListingBoostEvent(payload)).toBe(true);
  });

  it("invalidates the classified collection and its public path", () => {
    expect(resolvePublicCacheKinds(payload)).toEqual(["classified"]);
    expect(buildRevalidatePaths(payload)).toContain("/petites-annonces");
  });
});
