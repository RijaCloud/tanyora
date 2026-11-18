import { NextResponse } from "next/server";
import { isDetailedHealthRequest, redactReport, runDeepHealthCheck } from "@/lib/health/checks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

/**
 * Readiness et diagnostic. Interroge WordPress, le cache partage et MongoDB en
 * parallele, et rapporte le statut et la latence de chacun.
 *
 * Repond 200 par defaut, quel que soit l'etat des dependances : le corps porte
 * le verdict. Passer `?strict=1` pour obtenir un 503 des que le statut n'est
 * pas `ok`, pour les superviseurs qui se basent sur le code HTTP.
 *
 * A ne pas brancher sur le load balancer, utiliser `/api/health` pour cela.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const strict = url.searchParams.get("strict") === "1";

  try {
    const report = await runDeepHealthCheck();
    const payload = isDetailedHealthRequest(request) ? report : redactReport(report);
    const status = strict && report.status !== "ok" ? 503 : 200;

    return NextResponse.json(payload, { status, headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        status: "down",
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Echec de la sonde.",
        checks: [],
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
