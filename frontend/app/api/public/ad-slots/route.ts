import { NextRequest, NextResponse } from "next/server";

import { AD_SLOT_KEYS } from "@/config/ad-slots";
import {
  getWordPressAdSlots,
  getWordPressPublicSiteConfig,
  type PublicAdFeature,
  type ResolvedAdSlots,
} from "@/lib/api/wordpress-internal";

export const dynamic = "force-dynamic";

const FEATURES: PublicAdFeature[] = ["all", "classified", "job", "tender"];

function parseFeature(value: string | null): PublicAdFeature {
  return FEATURES.includes(value as PublicAdFeature) ? (value as PublicAdFeature) : "all";
}

/**
 * Résolution de tous les emplacements en un appel, plus le mode global de la
 * régie. Le contenu vient du gestionnaire de publicités WordPress ; le frontend
 * ne fait que demander les positions qu'il sait rendre.
 */
export async function GET(request: NextRequest) {
  const feature = parseFeature(request.nextUrl.searchParams.get("feature"));

  const [slotsResult, configResult] = await Promise.allSettled([
    getWordPressAdSlots(AD_SLOT_KEYS, feature),
    getWordPressPublicSiteConfig(),
  ]);

  const slots: ResolvedAdSlots = slotsResult.status === "fulfilled" ? slotsResult.value.slots ?? {} : {};

  // Le mode reste piloté par la configuration globale : `preview` sert à
  // contrôler le placement sans dépendre d'un compte publicitaire.
  const rawMode = configResult.status === "fulfilled" ? configResult.value.adsense?.mode : undefined;
  const mode = rawMode === "disabled" || rawMode === "adsense" ? rawMode : "placeholder";
  const showPlaceholders = configResult.status === "fulfilled" ? configResult.value.adsense?.showPlaceholders === true : false;
  const clientId =
    configResult.status === "fulfilled" ? (configResult.value.adsense?.clientId ?? "").trim() : "";

  if (slotsResult.status === "rejected") {
    console.error("[ads] résolution des emplacements impossible", slotsResult.reason);
  }

  return NextResponse.json(
    { mode, showPlaceholders, clientId, feature, slots },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
