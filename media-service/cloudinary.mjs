import { createHash, timingSafeEqual, randomUUID } from "node:crypto";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function equalSecret(candidate, expected) {
  if (!candidate || !expected) return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function signParameters(parameters, secret) {
  const input = Object.entries(parameters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha256").update(input + secret).digest("hex");
}

export function createUploadAuthorization(input, config, now = Date.now()) {
  if (!IMAGE_TYPES.has(input?.mimeType) || !Number.isInteger(input?.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > MAX_IMAGE_BYTES) {
    throw new RangeError("Invalid image type or size");
  }
  const publicId = `tanyora/${new Date(now).toISOString().slice(0, 10)}/${randomUUID()}`;
  const parameters = {
    public_id: publicId,
    timestamp: String(Math.floor(now / 1000)),
    upload_preset: config.uploadPreset,
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,
    method: "POST",
    fields: {
      ...parameters,
      api_key: config.apiKey,
      signature: signParameters(parameters, config.apiSecret),
    },
    publicId,
    expiresInSeconds: 300,
  };
}

export function isManagedPublicId(publicId) {
  return typeof publicId === "string" && /^tanyora\/[a-zA-Z0-9/_-]{1,180}$/.test(publicId) && !publicId.includes("..") && !publicId.includes("//");
}

export async function deleteAssets(publicIds, config, fetchImpl = fetch, now = Date.now()) {
  if (!Array.isArray(publicIds) || publicIds.length < 1 || publicIds.length > 100 || publicIds.some((id) => !isManagedPublicId(id))) {
    throw new RangeError("Invalid asset identifiers");
  }
  const deletedIds = [];
  const failedIds = [];
  for (const publicId of new Set(publicIds)) {
    const parameters = { public_id: publicId, timestamp: String(Math.floor(now / 1000)), invalidate: "true" };
    const body = new URLSearchParams({ ...parameters, api_key: config.apiKey, signature: signParameters(parameters, config.apiSecret) });
    try {
      const response = await fetchImpl(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/destroy`, {
        method: "POST",
        body,
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      if (response.ok && (result.result === "ok" || result.result === "not found")) deletedIds.push(publicId);
      else failedIds.push(publicId);
    } catch {
      failedIds.push(publicId);
    }
  }
  return { deletedIds, failedIds };
}
