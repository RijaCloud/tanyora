import { NextResponse } from "next/server";
import { getWordPressLocationTerms } from "@/lib/api/wordpress-internal";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";

type LocationKind = "classified" | "job" | "tender" | "directory";

function isLocationKind(value: string): value is LocationKind {
  return value === "classified" || value === "job" || value === "tender" || value === "directory";
}

export async function GET(_request: Request, context: { params: { kind: string } }) {
  const kind = context.params.kind;
  if (!isLocationKind(kind)) {
    return NextResponse.json({ error: "Unknown listing kind." }, { status: 404 });
  }

  try {
    const result = await getWordPressLocationTerms(kind);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Unable to load locations.") },
      { status: 502 },
    );
  }
}
