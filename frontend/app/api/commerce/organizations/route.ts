import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { getServerSession } from "@/lib/auth/session";
import { createPendingOrganization, listMemberOrganizations } from "@/lib/commerce/organizations";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const inputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  countryCode: z.string().regex(/^[A-Za-z]{2}$/),
}).strict();

const noStore = { "Cache-Control": "private, no-store" };

function authorizedUserId() {
  const session = getServerSession();
  if (!session?.wpUserId || isOnboardingRequired(session) || isEmailVerificationRequired(session)) return null;
  return session.wpUserId;
}

export async function GET() {
  const wpUserId = authorizedUserId();
  if (!wpUserId) return NextResponse.json({ error: "Connexion requise." }, { status: 401, headers: noStore });

  try {
    const items = await listMemberOrganizations(wpUserId);
    return NextResponse.json({ items }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Organisations indisponibles pour le moment." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: NextRequest) {
  const wpUserId = authorizedUserId();
  if (!wpUserId) return NextResponse.json({ error: "Connexion requise." }, { status: 401, headers: noStore });

  const requestKey = request.headers.get("x-idempotency-key")?.trim() || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestKey)) {
    return NextResponse.json({ error: "Clé de requête manquante." }, { status: 400, headers: noStore });
  }

  const body = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Vérifiez le nom et le pays de l'organisation." }, { status: 400, headers: noStore });
  }

  const limit = await consumeRateLimit({
    scope: "commerce-organization-create",
    subject: String(wpUserId),
    limit: 5,
    windowSeconds: 3600,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Veuillez patienter avant une nouvelle tentative." }, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  try {
    const organization = await createPendingOrganization({
      wpUserId,
      name: parsed.data.name,
      countryCode: parsed.data.countryCode.toUpperCase(),
      requestKey,
    });
    return NextResponse.json({ organization }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ error: "Enregistrement indisponible pour le moment." }, { status: 503, headers: noStore });
  }
}
