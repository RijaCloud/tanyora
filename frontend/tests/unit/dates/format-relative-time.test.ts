import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "@/lib/dates/formatRelativeTime";

describe("formatRelativeTime", () => {
  it("parses french slash dates as day/month/year before native Date parsing", () => {
    const now = new Date(2026, 6, 6, 12, 0, 0).getTime();

    expect(formatRelativeTime("02/07/2026", now)).toBe("il y a 4 jours");
  });

  it("keeps iso dates working for public listing cards", () => {
    const now = new Date(2026, 6, 6, 12, 0, 0).getTime();

    expect(formatRelativeTime("2026-07-02", now)).toBe("il y a 4 jours");
  });
});
