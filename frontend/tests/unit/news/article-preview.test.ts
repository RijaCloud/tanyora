import { describe, expect, it } from "vitest";
import { previewRestrictedArticleHtml } from "@/features/news/lib/article-preview";

describe("restricted article preview", () => {
  it("marks the visible excerpt as truncated", () => {
    expect(previewRestrictedArticleHtml("<p>Un article réservé aux abonnés.</p>", 3)).toBe("Un article réservé aux […]");
  });
});
