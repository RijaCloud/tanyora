import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function POST() {
  const session = getServerSession();

  if (!session?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user: session });
}
