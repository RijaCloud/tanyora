import { describe, expect, it } from "vitest";
import {
  DIRECTORY_DEMO_CATEGORIES,
  DIRECTORY_DEMO_CITIES_BY_REGION,
  DIRECTORY_DEMO_COMPANIES,
  DIRECTORY_DEMO_REGIONS,
} from "@/features/directory/demo-fixtures";

describe("directory demo fixtures", () => {
  it("contains distinct, clearly fictional profiles without contact actions", () => {
    expect(DIRECTORY_DEMO_COMPANIES).toHaveLength(8);
    expect(new Set(DIRECTORY_DEMO_COMPANIES.map((company) => company.id)).size).toBe(8);
    for (const company of DIRECTORY_DEMO_COMPANIES) {
      expect(company.id).toMatch(/^demo-/);
      expect(company.name).toContain("(démo)");
      expect(company.phone).toBe("Non communiqué");
      expect(company.email).toBe("Non communiqué");
      expect(company.website).toBeUndefined();
      expect(company.featured).toBeUndefined();
      expect(company.ownerWpUserId).toBeUndefined();
    }
  });

  it("provides matching categories and region-to-city filters", () => {
    expect(DIRECTORY_DEMO_CATEGORIES).toContain("Géologue consultant");
    expect(DIRECTORY_DEMO_REGIONS).toContain("Analamanga");
    expect(DIRECTORY_DEMO_CITIES_BY_REGION.Analamanga).toContain("Antananarivo");
  });
});
