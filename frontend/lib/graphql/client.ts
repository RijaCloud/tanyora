import "server-only";

import { createHash } from "node:crypto";
import { cacheStore } from "@/lib/cache";

const WP_GRAPHQL_URL = process.env.WP_GRAPHQL_URL;
const WP_GRAPHQL_LOGS_ENABLED =
  process.env.WP_GRAPHQL_LOGS === "true" || process.env.NODE_ENV === "development";
const WP_GRAPHQL_METRICS_ENABLED = process.env.WP_GRAPHQL_METRICS === "true";
const EDITORIAL_CACHE_VERSION_KEY = "wp-graphql:editorial-version";
const EDITORIAL_CACHE_VERSION_TTL_SECONDS = 24 * 60 * 60;
const EDITORIAL_CACHE_TTL_SECONDS = 60 * 60;
const inFlightRequests = new Map<string, Promise<unknown>>();

type GraphqlCacheOptions = {
  tags?: string[];
  revalidate?: number | false;
  noStore?: boolean;
  ttlSeconds?: number;
};

function getOperationName(query: string): string {
  const compactQuery = query.replace(/\s+/g, " ").trim();
  const match = compactQuery.match(/(?:query|mutation)\s+([A-Za-z0-9_]+)/);
  return match?.[1] ?? "anonymous";
}

function logWpGraphql(event: string, details: Record<string, unknown>): void {
  if (!WP_GRAPHQL_LOGS_ENABLED) return;
  console.log(`[wp-graphql][${event}]`, details);
}

function logWpGraphqlMetric(details: Record<string, unknown>) {
  if (!WP_GRAPHQL_METRICS_ENABLED) return;
  console.info("[wp-graphql][metric]", JSON.stringify(details));
}

async function getEditorialCacheVersion() {
  return (await cacheStore.get<number>(EDITORIAL_CACHE_VERSION_KEY)) ?? 1;
}

function buildEditorialCacheKey(endpoint: string, query: string, variables: Record<string, unknown> | undefined, version: number) {
  const digest = createHash("sha256")
    .update(JSON.stringify({ endpoint, query, variables: variables ?? null }))
    .digest("hex");
  return `wp-graphql:editorial:v${version}:${digest}`;
}

/** Invalidates every shared editorial query after a trusted WordPress webhook. */
export async function invalidateWpGraphqlEditorialCache() {
  await cacheStore.increment(EDITORIAL_CACHE_VERSION_KEY, EDITORIAL_CACHE_VERSION_TTL_SECONDS);
}

export async function wpGraphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  cacheOptions?: GraphqlCacheOptions,
  endpoint?: string,
): Promise<T> {
  const resolvedUrl = endpoint?.trim() || WP_GRAPHQL_URL;

  if (!resolvedUrl) {
    throw new Error("WP_GRAPHQL_URL is not configured.");
  }

  const operationName = getOperationName(query);
  const useSharedCache = !cacheOptions?.noStore;
  const cacheVersion = useSharedCache ? await getEditorialCacheVersion() : null;
  const cacheKey = useSharedCache && cacheVersion !== null
    ? buildEditorialCacheKey(resolvedUrl, query, variables, cacheVersion)
    : null;

  if (cacheKey) {
    const cached = await cacheStore.get<T>(cacheKey);
    if (cached !== null) {
      logWpGraphqlMetric({ operationName, cache: "hit", durationMs: 0 });
      return cached;
    }

    const inFlight = inFlightRequests.get(cacheKey) as Promise<T> | undefined;
    if (inFlight) {
      logWpGraphqlMetric({ operationName, cache: "coalesced", durationMs: 0 });
      return inFlight;
    }
  }

  const request = (async () => {
  const startedAt = Date.now();

  const requestInit: RequestInit & { next?: { tags?: string[]; revalidate?: number | false } } = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  };

  // Redis is the authoritative shared cache for editorial POST requests. The
  // network request itself must stay uncached so webhook invalidation is exact.
  requestInit.cache = "no-store";

  logWpGraphql("request", {
    operationName,
    url: resolvedUrl,
    method: requestInit.method,
    cache: useSharedCache ? "redis" : "no-store",
    tags: cacheOptions?.tags ?? [],
    revalidate: cacheOptions?.noStore ? "no-store" : (cacheOptions?.revalidate ?? 300),
    variables: variables ?? null,
  });

  const response = await fetch(resolvedUrl, requestInit);
  const durationMs = Date.now() - startedAt;

  logWpGraphql("response", {
    operationName,
    status: response.status,
    ok: response.ok,
    durationMs,
  });

  if (!response.ok) {
    logWpGraphql("error", {
      operationName,
      status: response.status,
      durationMs,
    });
    throw new Error(`WPGraphQL request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    logWpGraphql("graphql-error", {
      operationName,
      durationMs,
      errors: payload.errors.map((error) => error.message),
    });
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  if (!payload.data) {
    logWpGraphql("empty-data", {
      operationName,
      durationMs,
    });
    throw new Error("WPGraphQL returned no data.");
  }

  logWpGraphql("success", {
    operationName,
    durationMs,
  });

  if (cacheKey) {
    await cacheStore.set(cacheKey, payload.data, cacheOptions?.ttlSeconds ?? EDITORIAL_CACHE_TTL_SECONDS);
  }
  logWpGraphqlMetric({ operationName, cache: cacheKey ? "miss" : "bypass", durationMs });

  return payload.data;
  })();

  if (!cacheKey) {
    return request;
  }

  inFlightRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}
