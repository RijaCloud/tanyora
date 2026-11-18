import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const source = process.env.LEGACY_SITEMAP_URL || "https://prod.2424.mg/sitemap_index.xml";
const canonicalOrigin = process.env.CANONICAL_ORIGIN || "https://www.2424.mg";
const output = process.env.LEGACY_SITEMAP_OUTPUT || "reports/seo/legacy-url-inventory.json";

function locations(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi), ([, value]) => value.trim()).filter(Boolean);
}

async function readSitemap(url, visited, urls) {
  if (visited.has(url)) return;
  visited.add(url);

  const response = await fetch(url, { headers: { "user-agent": "2424-seo-migration-inventory/1.0" } });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  const xml = await response.text();
  const entries = locations(xml);
  const isIndex = /<sitemapindex\b/i.test(xml);

  if (isIndex) {
    await Promise.all(entries.map((entry) => readSitemap(entry, visited, urls)));
    return;
  }

  entries.forEach((entry) => {
    const legacy = new URL(entry);
    const canonical = new URL(`${legacy.pathname}${legacy.search}`, canonicalOrigin).toString();
    urls.set(entry, canonical);
  });
}

const visited = new Set();
const mappings = new Map();
await readSitemap(source, visited, mappings);

const inventory = {
  generatedAt: new Date().toISOString(),
  source,
  canonicalOrigin,
  sitemapCount: visited.size,
  urlCount: mappings.size,
  redirects: Array.from(mappings, ([legacyUrl, canonicalUrl]) => ({ legacyUrl, canonicalUrl })),
};

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
console.log(`Inventory written to ${output}: ${inventory.urlCount} URLs from ${inventory.sitemapCount} sitemaps.`);
