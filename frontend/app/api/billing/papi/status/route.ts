import { NextResponse } from "next/server";
import { getPapiStatusFromWordPress } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    orderId?: number;
    key?: string;
  } | null;
  const orderId = Number(body?.orderId || 0);
  if (!Number.isInteger(orderId) || orderId <= 0 || !body?.key) {
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });
  }

  try {
    const payment = await getPapiStatusFromWordPress({
      wpUserId: session.wpUserId,
      orderId,
      key: body.key,
    });
    const status = payment.paymentStatus || "pending";
    return NextResponse.json({
      ...payment,
      status,
      isConfirmed: status === "paid",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de vérifier le paiement." },
      { status: 500 },
    );
  }
}
