import { execSync } from "node:child_process";

const stagedFilesOutput = execSync("git diff --cached --name-only --diff-filter=ACMR", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});

const stagedFiles = stagedFilesOutput
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean)
  .filter((file) => /\.(ts|tsx|js|jsx|mjs|cjs|json|md|php)$/i.test(file));

const ignoredFiles = new Set([
  "scripts/check-staged-copy.mjs",
]);

if (stagedFiles.length === 0) {
  process.exit(0);
}

const diff = execSync("git diff --cached --unified=0 --no-color --text", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});

const mojibakePatterns = [
  /Ã[\u00A0-\u00BF]/u,
  /Â[\u00A0-\u00BF]/u,
  /â[\u0080-\u00BF]/u,
  /Å[\u00A0-\u00BF]/u,
  /\uFFFD/u,
  /�/u,
];

const unicodeEscapePattern = /\\u[0-9a-fA-F]{4}/u;

let currentFile = "";
const offenders = [];

for (const line of diff.split(/\r?\n/)) {
  if (line.startsWith("+++ b/")) {
    currentFile = line.slice(6).trim();
    continue;
  }

  if (!line.startsWith("+") || line.startsWith("+++")) {
    continue;
  }

  if (!currentFile || !stagedFiles.includes(currentFile)) {
    continue;
  }

  if (ignoredFiles.has(currentFile)) {
    continue;
  }

  const content = line.slice(1);
  if (mojibakePatterns.some((pattern) => pattern.test(content)) || unicodeEscapePattern.test(content)) {
    offenders.push({ file: currentFile, line: content.trim() });
  }
}

if (offenders.length > 0) {
  console.error("Commit bloqué : texte suspect détecté dans les lignes stagées.");
  for (const offender of offenders) {
    console.error(`- ${offender.file}: ${offender.line}`);
  }
  console.error("Utilise des accents réels et évite les séquences \\uXXXX ou le mojibake.");
  process.exit(1);
}

console.log("Aucun texte suspect détecté dans les lignes stagées.");
