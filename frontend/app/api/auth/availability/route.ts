import { NextRequest, NextResponse } from "next/server";
import { checkWordPressAuthAvailability } from "@/lib/api/wordpress-internal";

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const result = await checkWordPressAuthAvailability({
      username: body.username,
      email: body.email,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[auth/availability] unexpected error", error);
    return NextResponse.json(
      { error: "Validation temporairement indisponible." },
      { status: 400 },
    );
  }
}
