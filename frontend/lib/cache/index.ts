import "server-only";

import { LocalMemoryStore } from "@/lib/cache/local-memory-store";
import { RedisStore } from "@/lib/cache/redis-store";
import { ResilientStore } from "@/lib/cache/resilient-store";
import type { KeyValueStore } from "@/lib/cache/store";
import { NativeRedisClient } from "@/lib/cache/native-redis-client";

const cacheDriver = process.env.CACHE_DRIVER ?? "memory";

let singleton: KeyValueStore | null = null;
let primaryStore: KeyValueStore | null = null;

function getStore(): KeyValueStore {
  if (singleton) return singleton;

  const memoryStore = new LocalMemoryStore();

  if (cacheDriver === "redis") {
    const url = process.env.REDIS_URL?.trim();
    const keyPrefix = process.env.REDIS_KEY_PREFIX?.trim();

    if (!url || !keyPrefix) {
      console.warn("[cache] CACHE_DRIVER=redis mais REDIS_URL ou REDIS_KEY_PREFIX est absent. Fallback memory.");
      singleton = memoryStore;
      return singleton;
    }

    const connectTimeoutMs = Number(process.env.REDIS_CONNECT_TIMEOUT_MS ?? 1500);

    primaryStore = new RedisStore(
      new NativeRedisClient({
        url,
        connectTimeoutMs: Number.isFinite(connectTimeoutMs) && connectTimeoutMs > 0 ? connectTimeoutMs : 1500,
      }),
      keyPrefix.endsWith(":") ? keyPrefix : `${keyPrefix}:`,
    );

    singleton = new ResilientStore(primaryStore, memoryStore, { name: "Redis serveur" });
    return singleton;
  }

  singleton = memoryStore;
  return singleton;
}

export const cacheStore = getStore();

export type CacheBackendProbe = {
  driver: string;
  /** `disabled` : aucun backend partage, le cache est local au process. */
  status: "up" | "down" | "disabled";
  latencyMs: number | null;
  error?: string;
};

/**
 * Interroge le backend primaire directement, sans passer par ResilientStore :
 * celui-ci masque une panne Redis derriere le cache memoire, ce qui ferait
 * passer une indisponibilite pour un fonctionnement nominal.
 */
export async function probeCacheBackend(): Promise<CacheBackendProbe> {
  if (!primaryStore) {
    return {
      driver: cacheDriver === "redis" ? "redis (non configure, fallback memory)" : cacheDriver,
      status: "disabled",
      latencyMs: null,
    };
  }

  const key = "health:cache-probe";
  const startedAt = Date.now();

  try {
    const value = Date.now();
    await primaryStore.set(key, value, 60);
    const readBack = await primaryStore.get<number>(key);
    const latencyMs = Date.now() - startedAt;

    if (readBack !== value) {
      return {
        driver: cacheDriver,
        status: "down",
        latencyMs,
        error: "La valeur relue ne correspond pas a la valeur ecrite.",
      };
    }

    return { driver: cacheDriver, status: "up", latencyMs };
  } catch (error) {
    return {
      driver: cacheDriver,
      status: "down",
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Echec de la sonde de cache.",
    };
  }
}
