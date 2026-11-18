import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canRefreshCurrentWeatherLocation,
  clearStoredWeatherCoordinates,
  getStoredWeatherCoordinates,
  getCurrentWeatherCoordinates,
  hasWeatherLocationPromptedRecently,
  markWeatherLocationPrompted,
  storeWeatherCoordinates,
  WEATHER_LOCATION_CACHE_TTL_MS,
  WEATHER_GEOLOCATION_OPTIONS,
} from "@/lib/client/weather-location";

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

function setNavigator(value: unknown) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value,
  });
}

function setStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } },
  });
}

afterEach(() => {
  if (originalNavigator) {
    Object.defineProperty(globalThis, "navigator", originalNavigator);
  } else {
    Reflect.deleteProperty(globalThis, "navigator");
  }
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, "window");
  }
});

describe("weather location", () => {
  it("uses the browser coordinates only after the caller requests them", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({ coords: { latitude: -18.8792, longitude: 47.5079 } } as GeolocationPosition);
    });
    setNavigator({ geolocation: { getCurrentPosition } });

    await expect(getCurrentWeatherCoordinates()).resolves.toEqual({ latitude: -18.8792, longitude: 47.5079 });
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), WEATHER_GEOLOCATION_OPTIONS);
  });

  it("keeps the fallback when the user refuses location access", async () => {
    const getCurrentPosition = vi.fn((_success: PositionCallback, failure: PositionErrorCallback) => {
      failure({ code: 1, message: "Permission denied" } as GeolocationPositionError);
    });
    setNavigator({ geolocation: { getCurrentPosition } });

    await expect(getCurrentWeatherCoordinates()).rejects.toThrow("Antananarivo");
  });

  it("refreshes local weather only while geolocation permission remains granted", async () => {
    const query = vi.fn().mockResolvedValue({ state: "granted" });
    setNavigator({ geolocation: { getCurrentPosition: vi.fn() }, permissions: { query } });
    await expect(canRefreshCurrentWeatherLocation()).resolves.toBe(true);

    query.mockResolvedValue({ state: "prompt" });
    await expect(canRefreshCurrentWeatherLocation()).resolves.toBe(false);
  });

  it("reuses a valid stored location for twenty-four hours", () => {
    setStorage();
    const now = 1_700_000_000_000;
    storeWeatherCoordinates({ latitude: -18.8792, longitude: 47.5079 }, now);
    expect(getStoredWeatherCoordinates(now + WEATHER_LOCATION_CACHE_TTL_MS - 1)).toEqual({ latitude: -18.8792, longitude: 47.5079 });
    expect(getStoredWeatherCoordinates(now + WEATHER_LOCATION_CACHE_TTL_MS + 1)).toBeNull();
  });

  it("records a location prompt once without retaining coordinates after a refusal", () => {
    setStorage();
    const now = 1_700_000_000_000;
    markWeatherLocationPrompted(now);
    expect(hasWeatherLocationPromptedRecently(now + 1)).toBe(true);
    clearStoredWeatherCoordinates();
    expect(getStoredWeatherCoordinates(now + 1)).toBeNull();
  });
});
