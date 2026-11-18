import { describe, expect, it } from "vitest";
import { canReadFullArticle } from "@/features/news/lib/read-access";

describe("canReadFullArticle", () => {
  it("allows everyone when article is visible to all", () => {
    expect(canReadFullArticle("all", false, "visitor")).toBe(true);
    expect(canReadFullArticle("all", true, "free")).toBe(true);
  });

  it("requires at least essentiel when article is restricted", () => {
    expect(canReadFullArticle("essentiel", false, "visitor")).toBe(false);
    expect(canReadFullArticle("essentiel", true, "free")).toBe(false);
    expect(canReadFullArticle("essentiel", true, "essentiel")).toBe(true);
    expect(canReadFullArticle("essentiel", true, "business")).toBe(true);
  });

  it("requires business when article is business-only", () => {
    expect(canReadFullArticle("business", true, "essentiel")).toBe(false);
    expect(canReadFullArticle("business", true, "business")).toBe(true);
  });
});
