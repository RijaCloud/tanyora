import { describe, expect, it } from "vitest";
import { EXCHANGE_FIXTURES, filterExchangeFixtures } from "@/lib/exchange/fixtures";

describe("Exchange demo catalogue", () => {
  it("contains six distinct, explicitly fictitious specimens", () => {
    expect(EXCHANGE_FIXTURES).toHaveLength(6);
    expect(new Set(EXCHANGE_FIXTURES.map((item) => item.id)).size).toBe(6);
    expect(new Set(EXCHANGE_FIXTURES.map((item) => item.imagePosition)).size).toBe(6);
    for (const item of EXCHANGE_FIXTURES) {
      expect(item.id).toMatch(/^demo-/);
      expect(item.seller).toContain("fictive");
      expect(item.quantity).toContain("exemple");
      expect(JSON.stringify(item)).not.toMatch(/@|\+261|https?:\/\//);
    }
  });

  it("filters by search, family and market without backend calls", () => {
    expect(filterExchangeFixtures("quartz", "all", "all")).toHaveLength(2);
    expect(filterExchangeFixtures("", "Collection", "local")).toHaveLength(3);
    expect(filterExchangeFixtures("tourmaline", "all", "local")).toHaveLength(0);
    expect(filterExchangeFixtures("", "all", "international")).toHaveLength(2);
  });
});
