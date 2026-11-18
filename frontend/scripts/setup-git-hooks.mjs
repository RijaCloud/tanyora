import { execSync } from "node:child_process";

try {
  execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  execSync("git config core.hooksPath .githooks", { stdio: "ignore" });
  console.log("Git hooks path configuré sur .githooks");
} catch {
  console.log("Répertoire Git non détecté, hooks non configurés.");
}
