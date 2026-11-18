import test from "node:test";
import assert from "node:assert/strict";
import { createUploadAuthorization, deleteAssets, equalSecret, isManagedPublicId, signParameters } from "./cloudinary.mjs";

const config = { cloudName: "test-cloud", apiKey: "test-key", apiSecret: "test-secret", uploadPreset: "tanyora-images" };

test("upload signing accepts only bounded images", () => {
  const result = createUploadAuthorization({ mimeType: "image/jpeg", sizeBytes: 1024 }, config, 1000000000000);
  assert.match(result.publicId, /^tanyora\/2001-09-09\//);
  assert.equal(result.method, "POST");
  assert.equal(result.fields.signature, signParameters({ public_id: result.publicId, timestamp: result.fields.timestamp, upload_preset: config.uploadPreset }, config.apiSecret));
  assert.throws(() => createUploadAuthorization({ mimeType: "image/svg+xml", sizeBytes: 1024 }, config));
  assert.throws(() => createUploadAuthorization({ mimeType: "image/jpeg", sizeBytes: 6 * 1024 * 1024 }, config));
});

test("deletion cannot target another project", async () => {
  assert.equal(isManagedPublicId("tanyora/2026-11-10/example"), true);
  assert.equal(isManagedPublicId("2424/2026-11-10/example"), false);
  assert.equal(isManagedPublicId("tanyora/../other"), false);
  assert.equal(equalSecret("abc", "abc"), true);
  assert.equal(equalSecret("abc", "abd"), false);
  await assert.rejects(deleteAssets(["2424/foreign"], config, async () => { throw new Error("must not call"); }), RangeError);
});

test("deletion reports partial failure without losing successful IDs", async () => {
  const calls = [];
  const fetchImpl = async (_url, options) => {
    const id = new URLSearchParams(options.body).get("public_id");
    calls.push(id);
    return { ok: true, json: async () => ({ result: id.endsWith("good") ? "ok" : "error" }) };
  };
  const result = await deleteAssets(["tanyora/good", "tanyora/bad"], config, fetchImpl);
  assert.deepEqual(result, { deletedIds: ["tanyora/good"], failedIds: ["tanyora/bad"] });
  assert.deepEqual(calls, ["tanyora/good", "tanyora/bad"]);
});
