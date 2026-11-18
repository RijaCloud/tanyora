import { NextRequest, NextResponse } from "next/server";
import { getWordPressPublicListings } from "@/lib/api/wordpress-internal";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";

function values(params: URLSearchParams, key: string) {
  return params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 25);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Number.parseInt(params.get("page") || "1", 10);
  const perPage = Number.parseInt(params.get("perPage") || "12", 10);

  try {
    const result = await getWordPressPublicListings("directory", {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      perPage: Number.isFinite(perPage) && perPage > 0 ? Math.min(perPage, 24) : 12,
      search: (params.get("search") || "").trim() || undefined,
      category: (params.get("category") || "").trim() || undefined,
      featured: params.get("featured") === "true" || undefined,
      regions: values(params, "region"),
      cities: values(params, "city"),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "L'annuaire est temporairement indisponible.") },
      { status: 502 },
    );
  }
}
