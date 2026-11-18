import { describe, expect, it } from "vitest";
import { formatBookPrice } from "@/features/shop/book-format";

describe("book price formatting", () => {
  it("does not treat a missing price as free", () => {
    expect(formatBookPrice("", "MGA")).toBe("Prix à venir");
  });

  it("labels an explicit zero price as free", () => {
    expect(formatBookPrice("0", "MGA")).toBe("Gratuit");
  });

  it("formats a paid book in the configured currency", () => {
    expect(formatBookPrice("15000", "MGA")).toBe("15 000 Ar");
  });
});
