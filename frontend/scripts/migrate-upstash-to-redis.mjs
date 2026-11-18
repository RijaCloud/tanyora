#!/usr/bin/env node

import { createClient } from "redis";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const scanCountArgument = process.argv.find((argument) => argument.startsWith("--scan-count="));
const scanCount = Math.min(500, Math.max(10, Number(scanCountArgument?.split("=")[1]) || 100));
const messageTtlSeconds = 90 * 24 * 60 * 60;

const upstashUrl = String(process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
const upstashToken = String(process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
const redisUrl = String(process.env.REDIS_URL || "").trim();
const keyPrefix = String(process.env.REDIS_KEY_PREFIX || "").trim().replace(/:?$/, ":");

for (const [name, value] of Object.entries({ UPSTASH_REDIS_REST_URL: upstashUrl, UPSTASH_REDIS_REST_TOKEN: upstashToken, REDIS_URL: redisUrl, REDIS_KEY_PREFIX: keyPrefix })) {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

async function upstashPipeline(commands) {
  const response = await fetch(`${upstashUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed with HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Upstash returned an invalid pipeline response.");
  }

  return payload.map((entry) => {
    if (entry?.error) {
      throw new Error(`Upstash command failed: ${entry.error}`);
    }
    return entry?.result;
  });
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function normalizedUserKey(value) {
  return String(value || "").trim().toLowerCase();
}

function isStressValue(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && value.stressCampaign);
}

function cleanValue(key, raw, messageIndexes) {
  const parsed = parseJson(raw);

  if (key.startsWith("listing:messages:index:")) {
    // Rebuilt only from non-stress messages, preventing stale campaign IDs.
    return null;
  }

  if (key.startsWith("listing:messages:") && Array.isArray(parsed)) {
    const [kind, listingId] = key.split(":").slice(2);
    const messages = parsed.filter((message) => !isStressValue(message));
    for (const message of messages) {
      for (const address of [message?.senderEmail, message?.recipientEmail]) {
        const userKey = normalizedUserKey(address);
        if (!userKey || !kind || !listingId) continue;
        const indexKey = `listing:messages:index:${kind}:${userKey}`;
        const ids = messageIndexes.get(indexKey) ?? new Set();
        ids.add(Number(listingId));
        messageIndexes.set(indexKey, ids);
      }
    }
    return messages.length ? JSON.stringify(messages) : null;
  }

  if ((key.startsWith("profile:saved:") || key.startsWith("notifications:")) && Array.isArray(parsed)) {
    const values = parsed.filter((entry) => !isStressValue(entry) && !isStressValue(entry?.metadata));
    return values.length ? JSON.stringify(values) : null;
  }

  return raw;
}

function ttlOptions(ttlMs) {
  return Number.isFinite(ttlMs) && ttlMs > 0 ? { PX: ttlMs } : undefined;
}

async function main() {
  console.log(apply ? "Starting Upstash to Redis migration." : "Dry run: no Redis server values will be written. Add --apply to migrate.");

  const destination = createClient({ url: redisUrl, socket: { connectTimeout: 3000, reconnectStrategy: false } });
  destination.on("error", () => undefined);
  await destination.connect();

  const counters = { scanned: 0, migrated: 0, skippedStress: 0, expired: 0, rebuiltIndexes: 0 };
  const messageIndexes = new Map();
  let cursor = "0";

  try {
    do {
      const [scanResult] = await upstashPipeline([["SCAN", cursor, "COUNT", String(scanCount)]]);
      if (!Array.isArray(scanResult) || !Array.isArray(scanResult[1])) {
        throw new Error("Upstash returned an invalid SCAN result.");
      }
      cursor = String(scanResult[0]);
      const keys = scanResult[1].map(String);
      counters.scanned += keys.length;
      if (!keys.length) continue;

      const results = await upstashPipeline(keys.flatMap((key) => [["GET", key], ["PTTL", key]]));
      const transaction = destination.multi();
      let writesInBatch = 0;

      keys.forEach((key, index) => {
        const raw = results[index * 2];
        const ttlMs = Number(results[index * 2 + 1]);
        if (raw === null || ttlMs === -2) {
          counters.expired++;
          return;
        }

        const cleaned = cleanValue(key, String(raw), messageIndexes);
        if (cleaned === null) {
          counters.skippedStress++;
          return;
        }

        counters.migrated++;
        if (apply) {
          transaction.set(`${keyPrefix}${key}`, cleaned, ttlOptions(ttlMs));
          writesInBatch++;
        }
      });

      if (apply && writesInBatch) {
        await transaction.exec();
      }
      console.log(`Processed ${counters.scanned} keys; eligible ${counters.migrated}; skipped stress ${counters.skippedStress}.`);
    } while (cursor !== "0");

    const indexes = Array.from(messageIndexes.entries());
    for (let start = 0; start < indexes.length; start += scanCount) {
      const transaction = destination.multi();
      for (const [key, ids] of indexes.slice(start, start + scanCount)) {
        const payload = JSON.stringify(Array.from(ids).filter(Number.isFinite).slice(0, 500));
        if (apply) transaction.set(`${keyPrefix}${key}`, payload, { EX: messageTtlSeconds });
        counters.rebuiltIndexes++;
      }
      if (apply && indexes.slice(start, start + scanCount).length) await transaction.exec();
    }
  } finally {
    await destination.quit();
  }

  console.log(JSON.stringify({ mode: apply ? "applied" : "dry-run", ...counters }, null, 2));
}

main().catch((error) => {
  console.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
