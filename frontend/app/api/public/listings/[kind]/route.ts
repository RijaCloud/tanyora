import { NextRequest, NextResponse } from "next/server";
import {
  getWordPressPublicListings,
  getWordPressRequestStatus,
  type PublicListingKind,
} from "@/lib/api/wordpress-internal";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";

function isPublicKind(value: string): value is PublicListingKind {
  return value === "classified" || value === "job" || value === "tender" || value === "directory";
}

function parseListingDate(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) {
    return Number.NaN;
  }

  const parsed = new Date(raw).getTime();
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }

  return Number.NaN;
}

export async function GET(request: NextRequest, context: { params: { kind: string } }) {
  const kind = context.params.kind;
  if (!isPublicKind(kind)) {
    return NextResponse.json({ error: "Unknown listing kind." }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const perPage = Number.parseInt(searchParams.get("perPage") || "24", 10);
  const featured = searchParams.get("featured") === "true";
  const search = (searchParams.get("search") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const type = (searchParams.get("type") || "").trim();
  const productTag = (searchParams.get("productTag") || "").trim();
  const location = (searchParams.get("location") || "").trim();
  const city = (searchParams.get("city") || "").trim();
  const area = (searchParams.get("area") || "").trim();
  const company = (searchParams.get("company") || "").trim();
  const priceMin = (searchParams.get("priceMin") || "").trim();
  const priceMax = (searchParams.get("priceMax") || "").trim();
  const currency = (searchParams.get("currency") || "").trim();
  const ownerWpUserId = Number.parseInt(searchParams.get("ownerWpUserId") || "0", 10);
  const id = Number.parseInt(searchParams.get("id") || "0", 10);

  try {
    const result = await getWordPressPublicListings(kind, {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      perPage: Number.isFinite(perPage) && perPage > 0 ? Math.min(perPage, 50) : 24,
      featured: featured || undefined,
      search: search || undefined,
      category: category || undefined,
      type: type || undefined,
      productTag: productTag || undefined,
      location: location || undefined,
      city: city || undefined,
      area: area || undefined,
      company: company || undefined,
      priceMin: priceMin || undefined,
      priceMax: priceMax || undefined,
      currency: currency || undefined,
      ownerWpUserId: Number.isFinite(ownerWpUserId) && ownerWpUserId > 0 ? ownerWpUserId : undefined,
      id: Number.isFinite(id) && id > 0 ? id : undefined,
    });

    const normalizedItems = result.items.map(({ ownerEmail: _ownerEmail, ...item }) => item);
    const filteredItems =
      kind === "tender"
        ? normalizedItems
            .filter((item) => {
              const tenderItem = item as typeof item & { isExpired?: boolean; expiresAt?: string; date?: string };
              if (tenderItem.isExpired) {
                return false;
              }
              const expiresAt = parseListingDate(typeof tenderItem.expiresAt === "string" ? tenderItem.expiresAt : "");
              return !Number.isFinite(expiresAt) || expiresAt >= Date.now();
            })
            .sort((left, right) => {
              const leftDate = parseListingDate(typeof left.date === "string" ? left.date : "");
              const rightDate = parseListingDate(typeof right.date === "string" ? right.date : "");
              return (Number.isFinite(rightDate) ? rightDate : 0) - (Number.isFinite(leftDate) ? leftDate : 0);
            })
        : normalizedItems;

    return NextResponse.json({
      ...result,
      items: filteredItems,
    });
  } catch (error) {
    const upstreamStatus = getWordPressRequestStatus(error);
    return NextResponse.json(
      { error: getUserFacingErrorMessage(error, "Unable to load listings.") },
      { status: upstreamStatus === 503 ? 503 : 502 },
    );
  }
}
