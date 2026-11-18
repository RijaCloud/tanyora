export type VerificationUnavailable = {
  status: "unavailable";
  reason: "not_configured" | "provider_unavailable";
};

export type SellerScope = {
  substanceCode: string;
  market: "local" | "international";
  actorType: string;
  maxQuantity: string | null;
  quantityUnit: string;
  expiresAt: string;
};

export type SellerVerificationResult =
  | VerificationUnavailable
  | { status: "rejected"; checkedAt: string }
  | { status: "confirmed"; checkedAt: string; referenceDigest: string; scopes: SellerScope[] };

export type BuyerVerificationResult =
  | VerificationUnavailable
  | { status: "rejected"; checkedAt: string }
  | { status: "confirmed"; checkedAt: string; referenceDigest: string; expiresAt: string };

export interface InstitutionalSellerAdapter {
  verifySeller(organizationId: number): Promise<SellerVerificationResult>;
}

export interface BuyerKycAdapter {
  verifyBuyer(organizationId: number): Promise<BuyerVerificationResult>;
}

// No institution or KYC provider protocol has been approved for Tanyora.
export const unavailableSellerAdapter: InstitutionalSellerAdapter = {
  async verifySeller() {
    return { status: "unavailable", reason: "not_configured" };
  },
};

export const unavailableBuyerAdapter: BuyerKycAdapter = {
  async verifyBuyer() {
    return { status: "unavailable", reason: "not_configured" };
  },
};
