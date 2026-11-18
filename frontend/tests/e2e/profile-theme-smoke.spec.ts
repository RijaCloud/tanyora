import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  "/profil",
  "/profil/messages",
  "/profil/saved",
  "/profil/modifier",
  "/profil/petites-annonces",
];

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
  test.describe(`profile theme smoke ${theme}`, () => {
    for (const route of ROUTES) {
      test(`renders ${route} in ${theme} mode with authenticated session`, async ({ page }) => {
        await openWithTheme(page, route, theme);

        await expect(page).not.toHaveURL(/\/login/i);

        const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains("dark"));
        expect(hasDarkClass).toBe(theme === "dark");

        const pageStyles = await page.evaluate(() => {
          const bodyStyles = window.getComputedStyle(document.body);
          const main = document.querySelector("main");
          const mainStyles = main ? window.getComputedStyle(main) : null;

          return {
            bodyBackground: bodyStyles.backgroundColor,
            bodyColor: bodyStyles.color,
            mainBackground: mainStyles?.backgroundColor ?? bodyStyles.backgroundColor,
            mainColor: mainStyles?.color ?? bodyStyles.color,
            mainTextLength: main?.textContent?.trim().length ?? 0,
          };
        });

        const bodyBrightness = brightnessFromRgb(pageStyles.bodyBackground);
        const textBrightness = brightnessFromRgb(pageStyles.bodyColor);
        const mainBrightness = brightnessFromRgb(pageStyles.mainBackground);

        expect(bodyBrightness).not.toBeNull();
        expect(textBrightness).not.toBeNull();
        expect(pageStyles.mainTextLength).toBeGreaterThan(20);

        if (theme === "dark") {
          expect(bodyBrightness!).toBeLessThan(95);
          if (pageStyles.mainBackground !== "rgba(0, 0, 0, 0)") {
            expect(mainBrightness).not.toBeNull();
            expect(mainBrightness!).toBeLessThan(150);
          }
          expect(textBrightness!).toBeGreaterThan(150);
        } else {
          expect(bodyBrightness!).toBeGreaterThan(180);
          if (pageStyles.mainBackground !== "rgba(0, 0, 0, 0)") {
            expect(mainBrightness).not.toBeNull();
            expect(mainBrightness!).toBeGreaterThan(150);
          }
          expect(textBrightness!).toBeLessThan(125);
        }

        await expect(page.locator("main")).toBeVisible();
      });
    }
  });
}
