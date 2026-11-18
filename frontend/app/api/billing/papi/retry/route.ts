import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { retryPapiPaymentInWordPress } from "@/lib/api/wordpress-internal";

export async function POST(request: Request) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { orderId?: number; key?: string } | null;
  const orderId = Number(body?.orderId || 0);
  if (!Number.isInteger(orderId) || orderId <= 0 || !body?.key) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  try {
    const payment = await retryPapiPaymentInWordPress({ wpUserId: session.wpUserId, orderId, key: body.key });
    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de relancer le paiement." },
      { status: 500 },
    );
  }
}
