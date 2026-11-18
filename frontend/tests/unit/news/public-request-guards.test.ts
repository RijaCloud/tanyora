import { describe, expect, it } from "vitest";

import {
  MAX_EDITORIAL_PAGE,
  MAX_EDITORIAL_PER_PAGE,
  parseEditorialPage,
  parseEditorialPerPage,
} from "@/features/news/lib/public-pagination";

describe("public editorial request guards", () => {
  it("caps expensive pagination without changing normal UI values", () => {
    expect(parseEditorialPage("2")).toBe(2);
    expect(parseEditorialPerPage("12")).toBe(12);
    expect(parseEditorialPage("9999")).toBe(MAX_EDITORIAL_PAGE);
    expect(parseEditorialPerPage("9999")).toBe(MAX_EDITORIAL_PER_PAGE);
  });

  it("falls back safely for malformed or negative parameters", () => {
    expect(parseEditorialPage("invalid")).toBe(1);
    expect(parseEditorialPage("-1")).toBe(1);
    expect(parseEditorialPerPage("0")).toBe(12);
  });
});
