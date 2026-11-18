import { NextResponse } from "next/server";
import { getWordPressSubscriptionPricingConfig } from "@/lib/api/wordpress-internal";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const result = await getWordPressSubscriptionPricingConfig();
    return NextResponse.json(result, {
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Impossible de charger les tarifs d'abonnement.") },
      {
        status: 502,
        headers: NO_STORE_HEADERS,
      },
    );
  }
}
