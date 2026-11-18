import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { answerQuestion } from "./assistant.mjs";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const config = {
  apiKey: required("OPENAI_API_KEY"),
  model: required("OPENAI_MODEL"),
  secret: required("TANYORA_ASSISTANT_SERVICE_SECRET"),
};

function authorized(candidate) {
  if (typeof candidate !== "string") return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(config.secret);
  return left.length === right.length && timingSafeEqual(left, right);
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8000) throw new RangeError("Request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

createServer(async (req, res) => {
  if (req.url === "/health" && req.method === "GET") return json(res, 200, { ok: true });
  if (!authorized(req.headers["x-tanyora-assistant-secret"])) return json(res, 401, { error: "Unauthorized" });
  if (req.url !== "/chat" || req.method !== "POST") return json(res, 404, { error: "Not found" });
  try {
    const body = await readBody(req);
    return json(res, 200, { answer: await answerQuestion(body?.messages, config) });
  } catch (error) {
    return json(res, error instanceof RangeError || error instanceof SyntaxError ? 400 : 502, { error: "Assistant unavailable" });
  }
}).listen(Number(process.env.PORT || 3081), "0.0.0.0");
