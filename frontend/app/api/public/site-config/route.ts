import { NextResponse } from "next/server";
import { getWordPressPublicSiteConfig } from "@/lib/api/wordpress-internal";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: Request) {
  try {
    const config = await getWordPressPublicSiteConfig();
    return NextResponse.json(config, {
      headers: NO_STORE_HEADERS,
    });
  } catch {
    if (new URL(request.url).searchParams.get("strict") === "1") {
      return NextResponse.json(
        { error: "Impossible de charger la configuration." },
        { status: 503, headers: NO_STORE_HEADERS },
      );
    }
    return NextResponse.json(
      {
        classifiedJobBlendEnabled: false,
        annoncesDisplayMode: "separate",
        editorialSourceGraphqlUrl: null,
        adsense: {
          mode: "placeholder",
          enabled: false,
          showPlaceholders: false,
          articleInlineStartAfterBlocks: 3,
          articleInlineRepeatEveryBlocks: 4,
          clientId: "",
          slots: {
            topBanner: "",
            archiveInline: "",
            articleInline: "",
            articleRail: "",
          },
        },
        accessMatrix: {
          news: {
            minimumPlanOptions: [
              { value: "all", label: "Visible pour tous" },
              { value: "essentiel", label: "Essentiel et Business" },
              { value: "business", label: "Business uniquement" },
            ],
          },
          classifieds: {
            monthlyPosts: { free: 1, essentiel: 5, business: 10 },
            maxPhotos: { free: 2, essentiel: 10, business: 20 },
          },
          jobs: {
            monthlyPosts: { free: 0, essentiel: 5, business: 10 },
          },
          tenders: {
            minimumPlan: "business",
            responseMinimumPlan: "business",
          },
        },
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      },
    );
  }
}
