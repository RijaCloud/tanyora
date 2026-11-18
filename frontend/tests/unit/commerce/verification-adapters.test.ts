import { describe, expect, it } from "vitest";
import { unavailableBuyerAdapter, unavailableSellerAdapter } from "@/lib/commerce/verification-adapters";

describe("unconfigured commercial verification", () => {
  it("never confirms seller rights without a ministry adapter", async () => {
    expect(await unavailableSellerAdapter.verifySeller(1)).toEqual({
      status: "unavailable",
      reason: "not_configured",
    });
  });

  it("never confirms buyer KYC without a provider", async () => {
    expect(await unavailableBuyerAdapter.verifyBuyer(1)).toEqual({
      status: "unavailable",
      reason: "not_configured",
    });
  });
});
