import { createServer } from "node:http";
import { createUploadAuthorization, deleteAssets, equalSecret } from "./cloudinary.mjs";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const config = {
  cloudName: required("CLOUDINARY_CLOUD_NAME"),
  apiKey: required("CLOUDINARY_API_KEY"),
  apiSecret: required("CLOUDINARY_API_SECRET"),
  uploadPreset: required("CLOUDINARY_SIGNED_UPLOAD_PRESET"),
  sharedSecret: required("TANYORA_MEDIA_SERVICE_SECRET"),
};

function respond(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 16 * 1024) throw new RangeError("Request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") return respond(res, 200, { ok: true });
  if (!equalSecret(req.headers["x-tanyora-media-secret"], config.sharedSecret)) return respond(res, 401, { error: "Unauthorized" });
  if (req.method !== "POST") return respond(res, 405, { error: "Method not allowed" });
  try {
    const body = await readJson(req);
    if (req.url === "/media/sign-upload") return respond(res, 200, createUploadAuthorization(body, config));
    if (req.url === "/media/delete") return respond(res, 200, await deleteAssets(body?.publicIds, config));
    return respond(res, 404, { error: "Not found" });
  } catch (error) {
    return respond(res, error instanceof RangeError || error instanceof SyntaxError ? 400 : 502, { error: "Media request failed" });
  }
}).listen(Number(process.env.PORT || 3080), "0.0.0.0");
