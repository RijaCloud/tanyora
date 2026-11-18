import { NextRequest, NextResponse } from "next/server";

const OPEN_METEO_API_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const NOMINATIM_REVERSE_GEOCODING_URL = "https://nominatim.openstreetmap.org/reverse";
const ANTANANARIVO_COORDINATES = { latitude: -18.8792, longitude: 47.5079 };

type WeatherCondition = {
  label: string;
  key: "clear" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";
};

type ReverseGeocodingResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
  };
};

function getWeatherCondition(code: number): WeatherCondition {
  if (code === 0) return { label: "Ciel degage", key: "clear" };
  if ([1, 2, 3].includes(code)) return { label: code === 3 ? "Couvert" : "Peu nuageux", key: "cloudy" };
  if ([45, 48].includes(code)) return { label: "Brouillard", key: "fog" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Bruine", key: "drizzle" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Pluie", key: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Neige", key: "snow" };
  if ([95, 96, 99].includes(code)) return { label: "Orage", key: "storm" };
  return { label: "Variable", key: "cloudy" };
}

async function getWeather(latitude: number, longitude: number, location: string, cacheable: boolean) {
  const url = new URL(OPEN_METEO_API_BASE_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");
  url.searchParams.set("timezone", "Africa/Nairobi");

  const response = await fetch(url.toString(), cacheable ? { next: { revalidate: 1800 } } : { cache: "no-store" });
  if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}.`);

  const payload = (await response.json()) as {
    current?: { temperature_2m?: number; weather_code?: number; is_day?: number; time?: string };
  };
  const temperature = payload.current?.temperature_2m;
  const weatherCode = payload.current?.weather_code;
  if (typeof temperature !== "number" || typeof weatherCode !== "number") {
    throw new Error("Open-Meteo returned an incomplete weather payload.");
  }

  const condition = getWeatherCondition(weatherCode);
  return {
    location,
    temperatureCelsius: Math.round(temperature),
    weatherCode,
    conditionLabel: condition.label,
    conditionKey: condition.key,
    isDay: payload.current?.is_day === 1,
    updatedAt: payload.current?.time ?? null,
  };
}

function hasValidCoordinates(value: unknown): value is { latitude: number; longitude: number } {
  if (!value || typeof value !== "object") return false;
  const { latitude, longitude } = value as { latitude?: unknown; longitude?: unknown };
  return typeof latitude === "number" && typeof longitude === "number" && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

async function getLocalityName(latitude: number, longitude: number) {
  const url = new URL(NOMINATIM_REVERSE_GEOCODING_URL);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "fr");

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "Tanyora weather widget/1.0 (tanyora.mijary.tech)",
      },
    });
    if (!response.ok) return "Ma position";

    const payload = (await response.json()) as ReverseGeocodingResponse;
    const address = payload.address;
    return [address?.city, address?.town, address?.village, address?.municipality, address?.county]
      .find((locality): locality is string => typeof locality === "string" && locality.trim() !== "")
      ?.trim() || "Ma position";
  } catch {
    return "Ma position";
  }
}

export async function GET() {
  try {
    const weather = await getWeather(ANTANANARIVO_COORDINATES.latitude, ANTANANARIVO_COORDINATES.longitude, "Antananarivo", true);
    return NextResponse.json(weather, { headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=86400" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown weather error." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!hasValidCoordinates(body)) return NextResponse.json({ error: "Coordonnees invalides." }, { status: 400 });

  try {
    const [weather, location] = await Promise.all([
      getWeather(body.latitude, body.longitude, "Ma position", false),
      getLocalityName(body.latitude, body.longitude),
    ]);
    return NextResponse.json({ ...weather, location }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown weather error." }, { status: 503 });
  }
}
