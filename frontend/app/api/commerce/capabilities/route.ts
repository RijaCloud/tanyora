import { NextResponse } from "next/server";
import { loadCommerceCapabilities } from "@/lib/commerce/capabilities";

export const dynamic = "force-dynamic";

export async function GET() {
  const capabilities = await loadCommerceCapabilities();
  return NextResponse.json(capabilities, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
