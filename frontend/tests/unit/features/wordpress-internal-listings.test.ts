import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(callback: T) => callback,
  };
});

const cacheStoreMock = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  increment: vi.fn().mockResolvedValue(2),
  delete: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/lib/cache", () => ({
  cacheStore: cacheStoreMock,
}));

describe("wordpress internal listing normalization", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.WORDPRESS_INTERNAL_API_BASE_URL = "https://wp.internal";
    process.env.PLATFORM_SUBMISSIONS_SECRET = "secret";

    global.fetch = vi.fn();
  });

  it("normalizes public classified listings with decoded category, type and product tags", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 10,
              title: "Accessoires &amp; fitness",
              description: "Chaussures &amp; sacs",
              content: "<p>Pr&ecirc;t &agrave; porter</p>",
              location: "Antananarivo &amp; centre",
              date: "2026-06-11",
              category: "Mode &amp; Accessoires",
              productTag: "Pr&ecirc;t &agrave; porter",
              type: "Femme",
              companyName: "Boutique &amp; Co",
              price: "120000",
              currency: "MGA",
              regions: ["Analamanga"],
              cities: ["Antananarivo"],
            },
          ],
          pagination: {
            page: 1,
            perPage: 12,
            total: 1,
            totalPages: 1,
          },
        }),
        { status: 200 },
      ),
    );

    const { getWordPressPublicListings } = await import("@/lib/api/wordpress-internal");
    const result = await getWordPressPublicListings("classified", {
      page: 1,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://wp.internal/submissions/public/classified",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-2424-internal-secret": "secret",
        }),
      }),
    );
    expect(result.items[0]).toMatchObject({
      title: "Accessoires & fitness",
      description: "Chaussures & sacs",
      location: "Antananarivo & centre",
      category: "Mode & Accessoires",
      productTag: "Prêt à porter",
      type: "Femme",
      companyName: "Boutique & Co",
    });
  });

  it("forwards the featured filter used by sponsored listing rails", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ items: [], pagination: { page: 1, perPage: 50, total: 0, totalPages: 1 } }), { status: 200 }),
    );

    const { getWordPressPublicListings } = await import("@/lib/api/wordpress-internal");
    await getWordPressPublicListings("classified", { page: 1, perPage: 50, featured: true });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://wp.internal/submissions/public/classified",
      expect.objectContaining({
        body: JSON.stringify({ page: 1, perPage: 50, featured: true }),
      }),
    );
  });

  it("normalizes taxonomy terms and product tags used by classifieds and jobs filters", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          terms: [
            {
              id: 1,
              name: "Mode &amp; Accessoires",
              slug: "mode-accessoires",
              count: 4,
              parentName: "Petites annonces",
              parentSlug: "petites-annonces",
              productTagNames: ["Pr&ecirc;t &agrave; porter", "Chaussures"],
              productTagSlugs: ["pret-a-porter", "chaussures"],
            },
          ],
          productTags: [
            {
              id: 9,
              name: "Pr&ecirc;t &agrave; porter",
              slug: "pret-a-porter",
              count: 2,
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const { getWordPressTaxonomyTerms } = await import("@/lib/api/wordpress-internal");
    const result = await getWordPressTaxonomyTerms("classified");

    expect(result.terms[0]).toMatchObject({
      name: "Mode & Accessoires",
      productTagNames: ["Prêt à porter", "Chaussures"],
      productTagSlugs: ["pret-a-porter", "chaussures"],
    });
    expect(result.productTags[0]).toMatchObject({
      name: "Prêt à porter",
      slug: "pret-a-porter",
    });
  });
});
