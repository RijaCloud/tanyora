import { describe, expect, it } from "vitest";

import { loadPublicData } from "@/lib/public-data/safe-server-data";

describe("loadPublicData", () => {
  it("preserves fulfilled public data", async () => {
    const result = await loadPublicData(async () => ["annuaire"], [] as string[]);

    expect(result).toEqual({ data: ["annuaire"], available: true });
  });

  it("uses the supplied fallback when an upstream source fails", async () => {
    const result = await loadPublicData(async () => {
      throw new Error("WordPress unavailable");
    }, { terms: [] as string[] });

    expect(result).toEqual({ data: { terms: [] }, available: false });
  });

  it("keeps successful zones available when a sibling source fails", async () => {
    const [companies, locations] = await Promise.all([
      loadPublicData(async () => ["Entreprise 2424"], [] as string[]),
      loadPublicData(async () => {
        throw new Error("Locations unavailable");
      }, [] as string[]),
    ]);

    expect(companies).toEqual({ data: ["Entreprise 2424"], available: true });
    expect(locations).toEqual({ data: [], available: false });
  });
});
