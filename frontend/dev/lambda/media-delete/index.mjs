import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { timingSafeEqual } from "node:crypto";

const s3 = new S3Client({});
const MAX_KEYS_PER_REQUEST = 100;

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function json(statusCode, payload) {
  return { statusCode, body: JSON.stringify(payload) };
}

function isAuthorized(headers, secret) {
  const candidate = String(headers?.["x-2424-media-secret"] || headers?.["X-2424-Media-Secret"] || "");
  const expected = Buffer.from(secret);
  const actual = Buffer.from(candidate);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function isManagedKey(key) {
  return typeof key === "string" && /^uploads\/[A-Za-z0-9!_.*'()\-/]+$/.test(key) && !key.includes("..");
}

function objectKeysForSource(key) {
  const extensionIndex = key.lastIndexOf(".");
  if (extensionIndex < 0 || key.endsWith(".webp") || key.endsWith(".avif")) {
    return [key];
  }

  const base = key.slice(0, extensionIndex);
  return [key, `${base}.webp`, `${base}.avif`];
}

export const handler = async (event) => {
  const requestId = event?.requestContext?.requestId || null;
  const secret = required("MEDIA_DELETE_SHARED_SECRET");
  if (!isAuthorized(event?.headers, secret)) {
    console.warn("Media deletion unauthorized", {
      requestId,
      secretHeaderProvided: Boolean(event?.headers?.["x-2424-media-secret"] || event?.headers?.["X-2424-Media-Secret"]),
    });
    return json(401, { error: "Unauthorized" });
  }

  let body;
  try {
    body = JSON.parse(event?.body || "{}");
  } catch {
    console.warn("Media deletion rejected invalid JSON", { requestId });
    return json(400, { error: "Invalid JSON body." });
  }

  const sourceKeys = Array.isArray(body?.keys) ? [...new Set(body.keys)] : [];
  if (body?.dryRun === true) {
    if (sourceKeys.length !== 0) {
      console.warn("Media deletion rejected invalid dry-run", { requestId, sourceKeyCount: sourceKeys.length });
      return json(400, { error: "Dry-run does not accept media keys." });
    }
    required("MEDIA_UPLOAD_BUCKET");
    console.info("Media deletion dry-run succeeded", { requestId });
    return json(200, { ok: true });
  }

  if (sourceKeys.length === 0 || sourceKeys.length > MAX_KEYS_PER_REQUEST || sourceKeys.some((key) => !isManagedKey(key))) {
    console.warn("Media deletion rejected invalid keys", { requestId, sourceKeyCount: sourceKeys.length });
    return json(400, { error: "Invalid media keys." });
  }

  const bucket = required("MEDIA_UPLOAD_BUCKET");
  const expandedKeys = sourceKeys.flatMap(objectKeysForSource);

  try {
    console.info("Media deletion requested", {
      requestId,
      sourceKeyCount: sourceKeys.length,
      objectKeyCount: expandedKeys.length,
    });
    const response = await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: expandedKeys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    const failedObjectKeys = new Set((response.Errors || []).map((error) => error.Key).filter(Boolean));
    const failedKeys = sourceKeys.filter((key) => objectKeysForSource(key).some((objectKey) => failedObjectKeys.has(objectKey)));
    const deletedKeys = sourceKeys.filter((key) => !failedKeys.includes(key));

    console.info("Media deletion completed", {
      requestId,
      deletedCount: deletedKeys.length,
      failedCount: failedKeys.length,
    });

    return json(200, { deletedKeys, failedKeys });
  } catch (error) {
    console.error("Media deletion failed", {
      requestId,
      sourceKeyCount: sourceKeys.length,
      error: error instanceof Error ? error.message : String(error),
    });
    return json(502, { error: "Unable to delete media objects.", deletedKeys: [], failedKeys: sourceKeys });
  }
};
