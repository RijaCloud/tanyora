import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [
  path.join(root, "app"),
  path.join(root, "components"),
  path.join(root, "lib"),
  path.join(root, "features", "auth"),
  path.join(root, "features", "profile"),
  path.join(root, "features", "prototype", "pages"),
  path.join(root, "features", "prototype", "components"),
  path.join(root, "features", "subscriptions"),
  path.join(root, "features", "submissions"),
  path.join(root, "..", "wp-content", "plugins", "2424-wp-plugins", "includes"),
];

const excludedPathFragments = [
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}.next${path.sep}`,
  `${path.sep}.git${path.sep}`,
  `${path.sep}lib${path.sep}text${path.sep}mojibake.ts`,
  `${path.sep}lib${path.sep}api${path.sep}wordpress-internal.ts`,
  `${path.sep}lib${path.sep}content${path.sep}listing-html.ts`,
  `${path.sep}lib${path.sep}messages${path.sep}message-content.ts`,
];

const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".php"]);
const suspiciousFragments = ["ÃƒÆ’", "Ãƒâ€š", "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢", "ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ", "ÃƒÂ¢Ã¢â€šÂ¬", "\uFFFD", "�"];
const suspiciousRegexes = [/\\u[0-9a-fA-F]{4}/g];
const unicodeEscapeCheckExtensions = new Set([".tsx", ".jsx", ".md", ".json"]);
const visibleHtmlEntityCheckExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md"]);
const visibleHtmlEntityRegexes = [
  /&(rsquo|lsquo|rdquo|ldquo|ndash|mdash|hellip);/gi,
  /&(eacute|egrave|ecirc|agrave|acirc|ccedil|ugrave|ucirc|ocirc|icirc|iuml);/gi,
];

function shouldSkip(fullPath) {
  return excludedPathFragments.some((fragment) => fullPath.includes(fragment));
}

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (shouldSkip(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (allowedExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const offenders = [];

for (const target of targets) {
  for (const file of walk(target)) {
    const content = fs.readFileSync(file, "utf8");
    const foundFragments = suspiciousFragments.filter((fragment) => content.includes(fragment));
    const foundUnicodeEscapes = unicodeEscapeCheckExtensions.has(path.extname(file))
      ? suspiciousRegexes
          .flatMap((pattern) => content.match(pattern) ?? [])
          .filter((value, index, array) => array.indexOf(value) === index)
      : [];
    const foundVisibleHtmlEntities = visibleHtmlEntityCheckExtensions.has(path.extname(file))
      ? visibleHtmlEntityRegexes
          .flatMap((pattern) => content.match(pattern) ?? [])
          .filter((value, index, array) => array.indexOf(value) === index)
      : [];

    if (foundFragments.length > 0 || foundUnicodeEscapes.length > 0 || foundVisibleHtmlEntities.length > 0) {
      offenders.push({
        file,
        sample: [...foundFragments, ...foundUnicodeEscapes, ...foundVisibleHtmlEntities].join(", "),
      });
    }
  }
}

if (offenders.length > 0) {
  console.error("Texte suspect détecté dans les fichiers suivants :");
  for (const offender of offenders) {
    console.error(`- ${offender.file} (${offender.sample})`);
  }
  process.exit(1);
}

console.log("Aucun motif de mojibake, de caractère de remplacement ou d'unicode échappé détecté.");
