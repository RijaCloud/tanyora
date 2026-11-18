import { expect, test, type Page } from "@playwright/test";

const ROUTES = ["/", "/login", "/petites-annonces", "/tarifs"];

function brightnessFromRgb(rgb: string) {
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) {
    return null;
  }

  const [r, g, b] = match.slice(0, 3).map(Number);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

async function openWithTheme(page: Page, route: string, theme: "light" | "dark") {
  await page.addInitScript((value: "light" | "dark") => {
    window.localStorage.setItem("prototype-theme", value);
    document.documentElement.classList.toggle("dark", value === "dark");
  }, theme);

  await page.goto(route);
  await page.waitForLoadState("networkidle");
  await page.evaluate((value: "light" | "dark") => {
    window.localStorage.setItem("prototype-theme", value);
    document.documentElement.classList.toggle("dark", value === "dark");
  }, theme);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`theme smoke ${theme}`, () => {
    for (const route of ROUTES) {
      test(`renders ${route} in ${theme} mode`, async ({ page }) => {
        await openWithTheme(page, route, theme);

        const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains("dark"));
        expect(hasDarkClass).toBe(theme === "dark");

        const bodyStyles = await page.evaluate(() => {
          const styles = window.getComputedStyle(document.body);
          return {
            background: styles.backgroundColor,
            color: styles.color,
          };
        });

        const bodyBrightness = brightnessFromRgb(bodyStyles.background);
        const textBrightness = brightnessFromRgb(bodyStyles.color);

        expect(bodyBrightness).not.toBeNull();
        expect(textBrightness).not.toBeNull();

        if (theme === "dark") {
          expect(bodyBrightness!).toBeLessThan(90);
          expect(textBrightness!).toBeGreaterThan(150);
        } else {
          expect(bodyBrightness!).toBeGreaterThan(180);
          expect(textBrightness!).toBeLessThan(120);
        }

        await expect(page.locator("body")).toBeVisible();
        await expect(page.locator("body")).not.toBeEmpty();
      });
    }
  });
}
