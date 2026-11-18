import { revalidatePath, revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { invalidateAdSlotsCache, invalidatePublicPrivacyPolicyCache, invalidatePublicSiteConfigCache, invalidatePublicWordPressCache } from "@/lib/api/wordpress-internal";
import { invalidateEditorialCursorCache, invalidateEditorialSnapshots } from "@/features/news/data/news.repository";
import { invalidateWpGraphqlEditorialCache } from "@/lib/graphql/client";
import {
  buildRevalidatePaths,
  buildRevalidateTags,
  isListingBoostEvent,
  resolveModuleTag,
  resolvePublicCacheKinds,
  type NextRevalidatePayload,
} from "@/lib/wp/revalidate";

const INTERNAL_SECRET = process.env.PLATFORM_SUBMISSIONS_SECRET?.trim();

function isAuthorized(request: Request): boolean {
  const token = request.headers.get("x-2424-internal-secret")?.trim();

  if (!INTERNAL_SECRET || !token) return false;
  const expected = Buffer.from(INTERNAL_SECRET);
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as NextRevalidatePayload;

    if (!isAuthorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const tags = buildRevalidateTags(payload);
    const paths = buildRevalidatePaths(payload);
    const publicCacheKinds = resolvePublicCacheKinds(payload);
    const isListingBoost = isListingBoostEvent(payload);

    for (const tag of tags) {
      revalidateTag(tag);
    }

    for (const path of paths) {
      revalidatePath(path);
    }

    for (const kind of publicCacheKinds) {
      await invalidatePublicWordPressCache(kind);
    }

    const isEditorialChange = resolveModuleTag(payload.postType) === "news";
    if (isEditorialChange) {
      await Promise.all([
        invalidateEditorialCursorCache(),
        invalidateEditorialSnapshots(),
        invalidateWpGraphqlEditorialCache(),
      ]);
    }

    // Une publicite enregistree doit etre visible sans attendre l'expiration
    // du cache public.
    const isAdChange = payload.postType === "platform_ad";
    if (isAdChange) {
      await invalidateAdSlotsCache();
    }

    const isSiteConfigChange = payload.postType === "platform_settings";
    if (isSiteConfigChange) {
      await Promise.all([invalidatePublicSiteConfigCache(), invalidatePublicPrivacyPolicyCache()]);
      for (const path of ["/", "/actualites", "/petites-annonces", "/offres-emploi", "/appels-offres", "/annuaire", "/tarifs", "/politique-de-confidentialite"]) {
        revalidatePath(path);
      }
    }

    return NextResponse.json({
      ok: true,
      event: payload.event ?? "post.updated",
      postType: payload.postType ?? null,
      slug: payload.slug ?? null,
      tags,
      paths,
      publicCacheKinds,
      listingBoostCacheInvalidated: isListingBoost,
      adSlotsInvalidated: isAdChange,
      siteConfigInvalidated: isSiteConfigChange,
      editorialCursorCacheInvalidated: isEditorialChange,
      revalidatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
