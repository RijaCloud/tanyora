import { probeWordPressHealth } from "@/lib/api/wordpress-internal";
import { probeCacheBackend } from "@/lib/cache";
import { getMongoClient, getMongoDbName, isMongoConfigured } from "@/lib/mongodb";

export type DependencyStatus = "up" | "down" | "disabled";

export type DependencyCheck = {
  name: string;
  status: DependencyStatus;
  /** Une dependance critique en panne fait basculer la plateforme en `down`. */
  critical: boolean;
  latencyMs: number | null;
  error?: string;
  details?: unknown;
};

export type HealthStatus = "ok" | "degraded" | "down";

export type DeepHealthReport = {
  status: HealthStatus;
  checkedAt: string;
  totalMs: number;
  checks: DependencyCheck[];
};

const DEFAULT_PROBE_TIMEOUT_MS = 3000;

function getProbeTimeoutMs() {
  const raw = process.env.HEALTH_PROBE_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PROBE_TIMEOUT_MS;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} n'a pas repondu en moins de ${timeoutMs} ms.`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function checkWordPress(timeoutMs: number): Promise<DependencyCheck> {
  const probe = await probeWordPressHealth(timeoutMs);

  return {
    name: "wordpress",
    status: probe.status,
    critical: true,
    latencyMs: probe.latencyMs,
    error: probe.error,
    details: probe.details,
  };
}

async function checkCache(): Promise<DependencyCheck> {
  const probe = await probeCacheBackend();

  return {
    name: "cache",
    status: probe.status,
    // Une panne de cache degrade les temps de reponse sans interrompre le service.
    critical: false,
    latencyMs: probe.latencyMs,
    error: probe.error,
    details: { driver: probe.driver },
  };
}

async function checkMongo(timeoutMs: number): Promise<DependencyCheck> {
  if (!isMongoConfigured()) {
    return { name: "mongodb", status: "disabled", critical: false, latencyMs: null };
  }

  const startedAt = Date.now();

  try {
    const client = await withTimeout(getMongoClient(), timeoutMs, "MongoDB");
    await withTimeout(client.db(getMongoDbName()).command({ ping: 1 }), timeoutMs, "MongoDB");

    return { name: "mongodb", status: "up", critical: false, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      name: "mongodb",
      status: "down",
      critical: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Echec de la sonde MongoDB.",
    };
  }
}

function resolveStatus(checks: DependencyCheck[]): HealthStatus {
  if (checks.some((check) => check.critical && check.status === "down")) {
    return "down";
  }

  if (checks.some((check) => check.status === "down")) {
    return "degraded";
  }

  return "ok";
}

/**
 * Toutes les sondes partent en parallele et portent leur propre timeout : la
 * duree totale du rapport reste bornee meme si une dependance ne repond plus.
 */
export async function runDeepHealthCheck(): Promise<DeepHealthReport> {
  const timeoutMs = getProbeTimeoutMs();
  const startedAt = Date.now();

  const checks = await Promise.all([checkWordPress(timeoutMs), checkCache(), checkMongo(timeoutMs)]);

  return {
    status: resolveStatus(checks),
    checkedAt: new Date().toISOString(),
    totalMs: Date.now() - startedAt,
    checks,
  };
}

/**
 * Le detail des dependances (versions, diagnostics WordPress) n'est expose
 * qu'aux appelants qui presentent `HEALTH_DETAILS_TOKEN`. Sans jeton
 * configure, aucun detail ne sort.
 */
export function isDetailedHealthRequest(request: Request) {
  const expected = process.env.HEALTH_DETAILS_TOKEN?.trim();
  if (!expected) {
    return false;
  }

  const provided = request.headers.get("x-health-token")?.trim();
  if (!provided || provided.length !== expected.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ provided.charCodeAt(index);
  }

  return mismatch === 0;
}

export function redactReport(report: DeepHealthReport): DeepHealthReport {
  return {
    ...report,
    checks: report.checks.map(({ details, error, ...check }) => ({
      ...check,
      // L'erreur reste utile a un superviseur mais ne doit pas fuiter d'URL
      // ni de configuration interne.
      error: error ? "indisponible" : undefined,
    })),
  };
}
