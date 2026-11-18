export type WeatherCoordinates = {
  latitude: number;
  longitude: number;
};

type WeatherLocationCache = WeatherCoordinates & {
  version: 1;
  savedAt: number;
};

export type WeatherGeolocationPermission = "granted" | "prompt" | "denied" | "unknown" | "unsupported";

const WEATHER_LOCATION_CACHE_KEY = "2424.weather-location.v1";
const WEATHER_LOCATION_PROMPT_KEY = "2424.weather-location-prompted.v1";
export const WEATHER_LOCATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const WEATHER_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 5 * 60 * 1000,
  timeout: 10_000,
};

function isValidCoordinates(value: unknown): value is WeatherCoordinates {
  if (!value || typeof value !== "object") return false;
  const coordinates = value as Partial<WeatherCoordinates>;
  return Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
    && Math.abs(Number(coordinates.latitude)) <= 90
    && Math.abs(Number(coordinates.longitude)) <= 180;
}

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredWeatherCoordinates(now = Date.now()): WeatherCoordinates | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const cached = JSON.parse(storage.getItem(WEATHER_LOCATION_CACHE_KEY) || "null") as WeatherLocationCache | null;
    if (!cached || cached.version !== 1 || !isValidCoordinates(cached) || !Number.isFinite(cached.savedAt) || now - cached.savedAt < 0 || now - cached.savedAt > WEATHER_LOCATION_CACHE_TTL_MS) {
      storage.removeItem(WEATHER_LOCATION_CACHE_KEY);
      return null;
    }
    return { latitude: cached.latitude, longitude: cached.longitude };
  } catch {
    storage.removeItem(WEATHER_LOCATION_CACHE_KEY);
    return null;
  }
}

export function storeWeatherCoordinates(coordinates: WeatherCoordinates, savedAt = Date.now()) {
  const storage = getStorage();
  if (!storage || !isValidCoordinates(coordinates)) return;
  try {
    storage.setItem(WEATHER_LOCATION_CACHE_KEY, JSON.stringify({ version: 1, ...coordinates, savedAt } satisfies WeatherLocationCache));
    storage.removeItem(WEATHER_LOCATION_PROMPT_KEY);
  } catch {
    // Private browsing can reject storage. The in-memory header cache remains usable.
  }
}

export function clearStoredWeatherCoordinates() {
  const storage = getStorage();
  if (!storage) return;
  try { storage.removeItem(WEATHER_LOCATION_CACHE_KEY); } catch {}
}

export function hasWeatherLocationPromptedRecently(now = Date.now()) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const promptedAt = Number(storage.getItem(WEATHER_LOCATION_PROMPT_KEY));
    return Number.isFinite(promptedAt) && now - promptedAt >= 0 && now - promptedAt < WEATHER_LOCATION_CACHE_TTL_MS;
  } catch {
    return false;
  }
}

export function markWeatherLocationPrompted(now = Date.now()) {
  const storage = getStorage();
  if (!storage) return;
  try { storage.setItem(WEATHER_LOCATION_PROMPT_KEY, String(now)); } catch {}
}

export async function getWeatherGeolocationPermission(): Promise<WeatherGeolocationPermission> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return "unsupported";
  if (!navigator.permissions?.query) return "unknown";
  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    return permission.state === "granted" || permission.state === "denied" ? permission.state : "prompt";
  } catch {
    return "prompt";
  }
}

export function getCurrentWeatherCoordinates(): Promise<WeatherCoordinates> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("La géolocalisation n'est pas prise en charge par ce navigateur."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => reject(new Error("La météo reste réglée sur Antananarivo.")),
      WEATHER_GEOLOCATION_OPTIONS,
    );
  });
}

export async function canRefreshCurrentWeatherLocation(): Promise<boolean> {
  return (await getWeatherGeolocationPermission()) === "granted";
}
