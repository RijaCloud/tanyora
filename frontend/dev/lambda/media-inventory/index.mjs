import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { timingSafeEqual } from "node:crypto";

const s3 = new S3Client({});
const MAX_KEYS = 500;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function json(statusCode, payload) {
  return { statusCode, body: JSON.stringify(payload) };
}

function authorized(headers, secret) {
  const candidate = Buffer.from(String(headers?.["x-2424-media-secret"] || headers?.["X-2424-Media-Secret"] || ""));
  const expected = Buffer.from(secret);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export const handler = async (event) => {
  const requestId = event?.requestContext?.requestId || null;
  const secret = required("MEDIA_DELETE_SHARED_SECRET");
  if (!authorized(event?.headers, secret)) {
    console.warn("Media inventory unauthorized", { requestId });
    return json(401, { error: "Unauthorized" });
  }

  let body;
  try {
    body = JSON.parse(event?.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const maxKeys = Math.min(MAX_KEYS, Math.max(1, Number(body?.maxKeys) || MAX_KEYS));
  const continuationToken = typeof body?.cursor === "string" && body.cursor.length > 0 ? body.cursor : undefined;
  try {
    const response = await s3.send(new ListObjectsV2Command({
      Bucket: required("MEDIA_UPLOAD_BUCKET"),
      Prefix: "uploads/",
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    }));
    const objects = (response.Contents || [])
      .filter((item) => typeof item.Key === "string" && item.Key.startsWith("uploads/"))
      .map((item) => ({ key: item.Key, size: Number(item.Size || 0), lastModified: item.LastModified?.toISOString() || null }));
    console.info("Media inventory page listed", { requestId, objectCount: objects.length, hasNextCursor: Boolean(response.NextContinuationToken) });
    return json(200, { objects, nextCursor: response.NextContinuationToken || null });
  } catch (error) {
    console.error("Media inventory failed", { requestId, error: error instanceof Error ? error.message : String(error) });
    return json(502, { error: "Unable to list media objects." });
  }
};
