import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { NextResponse } from "next/server";
import { getWordPressPricingCatalog } from "@/lib/api/wordpress-internal";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getWordPressPricingCatalog();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Unable to load pricing catalog.") },
      { status: 502 },
    );
  }
}


