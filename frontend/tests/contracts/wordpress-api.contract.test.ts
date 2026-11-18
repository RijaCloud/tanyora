import { describe, expect, it } from "vitest";
import {
  wordPressFormConfigSchema,
  wordPressHealthSchema,
  wordPressListingResultSchema,
  wordPressPublishingAccessSchema,
} from "@/lib/contracts/wordpress-api";

describe("WordPress REST contracts", () => {
  it("accepts the idempotent listing publication result", () => {
    expect(wordPressListingResultSchema.parse({
      listingId: 42,
      postStatus: "publish",
      paymentStatus: "paid",
      alreadyPaid: true,
      usedIncludedAccess: true,
      includedCreditConsumed: false,
    })).toMatchObject({ listingId: 42, postStatus: "publish" });
  });

  it("rejects an incomplete publishing access response", () => {
    expect(() => wordPressPublishingAccessSchema.parse({ wpUserId: 42, planId: "free" })).toThrow();
  });

  it("bounds form options before they can be rendered", () => {
    expect(wordPressFormConfigSchema.parse({
      kind: "classified",
      categories: [{ id: 1, name: "Immobilier", slug: "immobilier" }],
      locations: [{ id: 2, name: "Antananarivo", slug: "antananarivo" }],
    }).categories).toHaveLength(1);
  });

  it("keeps the public health response minimal", () => {
    expect(wordPressHealthSchema.parse({
      ok: true,
      service: "2424-platform",
      time: "2026-09-06T12:00:00.000Z",
    }).ok).toBe(true);
  });
});
