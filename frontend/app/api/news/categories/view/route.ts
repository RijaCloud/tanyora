import { NextResponse } from "next/server";
import { trackNewsCategoryView } from "@/features/news/data/category-analytics";

type RequestPayload = {
  slug?: string;
  label?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as RequestPayload | null;
  const slug = payload?.slug?.trim().toLowerCase();

  if (!slug) {
    return NextResponse.json({ error: "Missing category slug." }, { status: 400 });
  }

  const views = await trackNewsCategoryView(slug, payload?.label);
  return NextResponse.json({ ok: true, views });
}
