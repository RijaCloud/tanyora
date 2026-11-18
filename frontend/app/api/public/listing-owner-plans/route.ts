import { NextRequest, NextResponse } from "next/server";

import { getWooCommerceSubscriptionSnapshot } from "@/lib/api/wordpress-internal";

type PremiumPlanId = "essentiel" | "business";

const PREMIUM_STATUSES = new Set(["active", "trialing"]);

function isPremiumPlanId(value: unknown): value is PremiumPlanId {
  return value === "essentiel" || value === "business";
}

export async function GET(request: NextRequest) {
  const ownerIds = Array.from(
    new Set(
      String(request.nextUrl.searchParams.get("ids") || "")
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  ).slice(0, 100);

  if (ownerIds.length === 0) {
    return NextResponse.json(
      { items: [] },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const results = await Promise.allSettled(
    ownerIds.map(async (wpUserId) => {
      const subscription = await getWooCommerceSubscriptionSnapshot({ wpUserId });
      if (!isPremiumPlanId(subscription.planId) || !PREMIUM_STATUSES.has(subscription.status)) {
        return null;
      }

      return {
        wpUserId,
        planId: subscription.planId,
      };
    }),
  );

  const items = results.flatMap((result) => (result.status === "fulfilled" && result.value ? [result.value] : []));

  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
