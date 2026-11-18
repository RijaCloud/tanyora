import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

async function loadRoute() {
  return import("@/app/api/weather/route");
}

function weatherResponse() {
  return new Response(
    JSON.stringify({
      current: {
        temperature_2m: 26.4,
        weather_code: 1,
        is_day: 1,
        time: "2026-10-07T08:30",
      },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("weather route", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses cached Antananarivo weather for the initial request", async () => {
    fetchMock.mockResolvedValue(weatherResponse());
    const { GET } = await loadRoute();

    const response = await GET();

    expect(response.headers.get("cache-control")).toContain("s-maxage=1800");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("latitude=-18.8792"),
      { next: { revalidate: 1800 } },
    );
  });

  it("uses the supplied local coordinates without caching them", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("https://nominatim.openstreetmap.org/reverse")) {
        return Promise.resolve(new Response(JSON.stringify({ address: { city: "Antsirabe" } }), { status: 200 }));
      }

      return Promise.resolve(weatherResponse());
    });
    const { POST } = await loadRoute();
    const request = new Request("http://localhost/api/weather", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ latitude: -18.91, longitude: 47.52 }),
    });

    const response = await POST(request as never);

    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("latitude=-18.91"),
      { cache: "no-store" },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("nominatim.openstreetmap.org/reverse"),
      expect.objectContaining({ cache: "no-store" }),
    );
    await expect(response.json()).resolves.toMatchObject({ location: "Antsirabe", temperatureCelsius: 26 });
  });

  it("keeps the local fallback label when reverse geocoding is unavailable", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("https://nominatim.openstreetmap.org/reverse")) {
        return Promise.resolve(new Response(null, { status: 503 }));
      }

      return Promise.resolve(weatherResponse());
    });
    const { POST } = await loadRoute();
    const request = new Request("http://localhost/api/weather", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ latitude: -18.91, longitude: 47.52 }),
    });

    const response = await POST(request as never);

    await expect(response.json()).resolves.toMatchObject({ location: "Ma position", temperatureCelsius: 26 });
  });
});
