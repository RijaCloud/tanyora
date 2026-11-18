import { describe, expect, it } from "vitest";
import { extractHierarchicalSlug, getEditorialArticlePath } from "@/features/news/lib/editorial-permalinks";

describe("getEditorialArticlePath", () => {
  it("keeps WordPress editorial posts at the domain root", () => {
    expect(getEditorialArticlePath({ slug: "economie-locale", source: "post" })).toBe("/economie-locale");
  });

  it("keeps flash-news CPT items under /news", () => {
    expect(getEditorialArticlePath({ slug: "alerte-routiere", source: "news" })).toBe("/news/alerte-routiere");
  });

  it("opens a linked flash-news item at its original editorial article", () => {
    expect(
      getEditorialArticlePath({
        slug: "flash-alerte-routiere",
        source: "news",
        flashSourceSlug: "alerte-routiere",
      }),
    ).toBe("/alerte-routiere");
  });

  it("preserves every level of a hierarchical category path", () => {
    expect(extractHierarchicalSlug(["reportages", "portrait"])).toBe("reportages/portrait");
  });
});
