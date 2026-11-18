import { NextRequest, NextResponse } from "next/server";
import { getWordPressPublicAds, type PublicAdFeature, type PublicAdPlacement } from "@/lib/api/wordpress-internal";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";

function isPublicAdPlacement(value: string): value is PublicAdPlacement {
  return value === "boost_list" || value === "inline_list";
}

function isPublicAdFeature(value: string): value is PublicAdFeature {
  return value === "all" || value === "classified" || value === "job" || value === "tender";
}

export async function GET(request: NextRequest) {
  const placement = (request.nextUrl.searchParams.get("placement") || "boost_list").trim();
  const feature = (request.nextUrl.searchParams.get("feature") || "all").trim();
  if (!isPublicAdPlacement(placement)) {
    return NextResponse.json({ error: "Unknown ad placement." }, { status: 404 });
  }
  if (!isPublicAdFeature(feature)) {
    return NextResponse.json({ error: "Unknown ad feature." }, { status: 404 });
  }

  try {
    const result = await getWordPressPublicAds(placement, feature);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Unable to load ads.") },
      { status: 502 },
    );
  }
}
