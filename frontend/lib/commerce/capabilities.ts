export type CommerceCapabilities = {
  schemaReady: boolean;
  mineralCatalog: boolean;
  sellerVerification: boolean;
  buyerVerification: boolean;
  quotes: boolean;
  orders: boolean;
  onlinePayments: boolean;
};

export const CLOSED_COMMERCE_CAPABILITIES: CommerceCapabilities = {
  schemaReady: false,
  mineralCatalog: false,
  sellerVerification: false,
  buyerVerification: false,
  quotes: false,
  orders: false,
  onlinePayments: false,
};

export function normalizeCommerceCapabilities(value: unknown): CommerceCapabilities {
  if (!value || typeof value !== "object") return { ...CLOSED_COMMERCE_CAPABILITIES };

  const received = value as Record<string, unknown>;
  const schemaReady = received.schemaReady === true;
  const sellerVerification = schemaReady && received.sellerVerification === true;
  const buyerVerification = schemaReady && received.buyerVerification === true;
  const quotes = sellerVerification && buyerVerification && received.quotes === true;
  const orders = quotes && received.orders === true;

  return {
    schemaReady,
    mineralCatalog: schemaReady && received.mineralCatalog === true,
    sellerVerification,
    buyerVerification,
    quotes,
    orders,
    // There is no approved mineral payment provider in Tanyora yet.
    onlinePayments: false,
  };
}

export async function loadCommerceCapabilities(): Promise<CommerceCapabilities> {
  const base = process.env.WORDPRESS_INTERNAL_API_BASE_URL?.trim();
  const secret = process.env.PLATFORM_SUBMISSIONS_SECRET?.trim();
  if (!base || !secret) return { ...CLOSED_COMMERCE_CAPABILITIES };

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/tanyora/commerce/capabilities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-2424-internal-secret": secret,
      },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return { ...CLOSED_COMMERCE_CAPABILITIES };
    return normalizeCommerceCapabilities(await response.json());
  } catch {
    return { ...CLOSED_COMMERCE_CAPABILITIES };
  }
}
