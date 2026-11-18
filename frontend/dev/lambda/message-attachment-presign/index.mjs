import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const s3 = new S3Client({});
const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const MAX_DOCUMENT_BYTES = 6 * 1024 * 1024;

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

  if (!DOCUMENT_MIME_TYPES.has(mimeType)) {
    return badRequest("Only PDF, Word and Excel uploads are allowed.");
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_DOCUMENT_BYTES) {
    return badRequest("Document size must be between 1 byte and 6 MB.");
  }

  const extension =
    mimeType === "application/pdf"
      ? "pdf"
      : mimeType === "application/msword"
        ? "doc"
        : mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ? "docx"
          : mimeType === "application/vnd.ms-excel"
            ? "xls"
            : mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              ? "xlsx"
      : "bin";
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
