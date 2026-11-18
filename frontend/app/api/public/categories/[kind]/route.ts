import { NextResponse } from "next/server";
import { getWordPressTaxonomyTerms, type PublicListingKind } from "@/lib/api/wordpress-internal";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";

function isPublicKind(value: string): value is PublicListingKind {
  return value === "classified" || value === "job" || value === "tender" || value === "directory";
}

export async function GET(_request: Request, context: { params: { kind: string } }) {
  const kind = context.params.kind;
  if (!isPublicKind(kind)) {
    return NextResponse.json({ error: "Unknown listing kind." }, { status: 404 });
  }

  try {
    const result = await getWordPressTaxonomyTerms(kind);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": kind === "directory"
          ? "no-store, no-cache, must-revalidate"
          : "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Unable to load categories.") },
      { status: 502 },
    );
  }
}
