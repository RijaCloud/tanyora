import { NextResponse } from "next/server";

import { getHomePublicListings } from "@/lib/home/public-listings";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";

const HOME_LISTINGS_CACHE_SECONDS = 60;

export async function GET() {
  try {
    const listings = await getHomePublicListings();

    return NextResponse.json(listings, {
      headers: {
        "Cache-Control": `public, s-maxage=${HOME_LISTINGS_CACHE_SECONDS}, stale-while-revalidate=300`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Impossible de charger les contenus de l'accueil.") },
      { status: 502 },
    );
  }
}
