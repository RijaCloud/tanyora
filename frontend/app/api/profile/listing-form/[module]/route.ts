import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getWordPressListingFormConfig } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";

const MODULE_KIND = {
  classifieds: "classified",
  jobs: "job",
  tenders: "tender",
} as const;

function getCachedConfig(kind: (typeof MODULE_KIND)[keyof typeof MODULE_KIND], categoryId = 0, cityId = 0) {
  return unstable_cache(
    () => getWordPressListingFormConfig(kind, { categoryId, cityId }),
    ["listing-form-config", kind, String(categoryId), String(cityId)],
    { revalidate: 300, tags: ["listing-form-config", `listing-form-config:${kind}`] },
  )();
}

export async function GET(request: Request, { params }: { params: { module: string } }) {
  if (!getServerSession()?.wpUserId) {
    return NextResponse.json({ error: "Utilisateur non connecté." }, { status: 401 });
  }

  const kind = MODULE_KIND[params.module as keyof typeof MODULE_KIND];
  if (!kind) {
    return NextResponse.json({ error: "Module inconnu." }, { status: 404 });
  }

  try {
    const url = new URL(request.url);
    const categoryId = Number.parseInt(url.searchParams.get("categoryId") || "0", 10) || 0;
    const cityId = Number.parseInt(url.searchParams.get("cityId") || "0", 10) || 0;
    return NextResponse.json(await getCachedConfig(kind, categoryId, cityId));
  } catch {
    return NextResponse.json({ error: "Impossible de charger les options du formulaire." }, { status: 502 });
  }
}
