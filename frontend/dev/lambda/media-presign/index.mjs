import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const s3 = new S3Client({});
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function badRequest(message) {
  return { statusCode: 400, body: JSON.stringify({ error: message }) };
}

export const handler = async (event) => {
  const bucket = required("MEDIA_UPLOAD_BUCKET");
  const publicBaseUrl = required("MEDIA_PUBLIC_BASE_URL");

  let body;
  try {
    body = JSON.parse(event?.body || "{}");
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const mimeType = String(body?.mimeType || "").toLowerCase();
  const sizeBytes = Number(body?.sizeBytes || 0);

  if (!mimeType.startsWith("image/")) {
    return badRequest("Only image uploads are allowed.");
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_IMAGE_BYTES) {
    return badRequest("Image size must be between 1 byte and 5 MB.");
  }

  const extension = mimeType.split("/")[1] || "bin";
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `${publicBaseUrl.replace(/\/$/, "")}/${key}`;

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl,
      key,
      publicUrl,
      expiresInSeconds: 300,
    }),
  };
};
