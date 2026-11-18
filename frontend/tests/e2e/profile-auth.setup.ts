import fs from "node:fs/promises";
import path from "node:path";
import { expect, test as setup } from "@playwright/test";

const authFile = path.join(process.cwd(), "tests", ".auth", "profile-user.json");

setup("create reusable authenticated profile session", async ({ page }) => {
  const unique = Date.now();
  const response = await page.request.post("/api/e2e/session", {
    data: {
      email: `playwright+profile-theme-${unique}@example.com`,
      username: `playwright_theme_${unique}`,
      name: "Playwright Theme",
    },
  });

  expect(response.ok()).toBeTruthy();

  await page.goto("/profil");
  await page.waitForLoadState("networkidle");
  await expect(page).not.toHaveURL(/\/login/i);

  await fs.mkdir(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
