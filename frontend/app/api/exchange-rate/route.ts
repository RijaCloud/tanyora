import { NextResponse } from "next/server";

const EXCHANGE_API_BASE_URL = "https://v6.exchangerate-api.com/v6";
const FALLBACK_BASE = "EUR";
function getExchangeRateApiKey() {
  const value = process.env.EXCHANGERATE_API_KEY;

  if (!value) {
    throw new Error("Missing EXCHANGERATE_API_KEY environment variable.");
  }

  return value;
}

function formatRate(rate: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(rate);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = (searchParams.get("base") || FALLBACK_BASE).toUpperCase();

  try {
    const apiKey = getExchangeRateApiKey();
    const response = await fetch(`${EXCHANGE_API_BASE_URL}/${apiKey}/latest/${base}`, {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      throw new Error(`ExchangeRate API returned ${response.status}.`);
    }

    const payload = (await response.json()) as {
      result?: string;
      conversion_rates?: Record<string, number>;
      time_last_update_unix?: number;
      time_next_update_unix?: number;
    };

    if (payload.result !== "success") {
      throw new Error("ExchangeRate API did not return a success payload.");
    }

    if (!payload.conversion_rates || Object.keys(payload.conversion_rates).length === 0) {
      throw new Error("ExchangeRate API returned no conversion rates.");
    }

    return NextResponse.json(
      {
        base,
        conversionRates: payload.conversion_rates,
        formattedRates: Object.fromEntries(
          Object.entries(payload.conversion_rates).map(([currencyCode, rate]) => [currencyCode, formatRate(rate)]),
        ),
        updatedAt:
          typeof payload.time_last_update_unix === "number"
            ? new Date(payload.time_last_update_unix * 1000).toISOString()
            : null,
        nextUpdateAt:
          typeof payload.time_next_update_unix === "number"
            ? new Date(payload.time_next_update_unix * 1000).toISOString()
            : null,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=1800, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown exchange rate error.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 503 },
    );
  }
}
