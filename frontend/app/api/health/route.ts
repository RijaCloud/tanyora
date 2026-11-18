import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

const BUILD_ID =
  process.env.NEXT_PUBLIC_BUILD_ID ||
  process.env.GITHUB_SHA ||
  process.env.AWS_COMMIT_ID ||
  process.env.AWS_JOB_ID ||
  "dev";

/**
 * Liveness. Aucune dependance externe : cette route ne repond que si le
 * process Node est vivant et capable de servir une requete.
 *
 * C'est la sonde a brancher sur le load balancer. Elle ne doit jamais dependre
 * de WordPress : sinon une panne WordPress ferait retirer toutes les instances
 * Next du pool, alors qu'elles peuvent encore servir les pages en cache.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "tanyora-frontend",
      buildId: BUILD_ID,
      uptimeSeconds: Math.round(process.uptime()),
      time: new Date().toISOString(),
    },
    { headers: NO_STORE_HEADERS },
  );
}

export async function HEAD() {
  return new Response(null, { status: 200, headers: NO_STORE_HEADERS });
}
