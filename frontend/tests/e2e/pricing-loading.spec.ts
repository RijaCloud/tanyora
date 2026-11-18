import { expect, test } from "@playwright/test";

const plan = (monthlyPriceAr: number) => ({
  monthlyPriceAr,
  annual: { available: false, grossAmountAr: monthlyPriceAr * 12, finalAmountAr: null },
});
const pricing = { plans: { free: plan(0), essentiel: plan(18000), business: plan(90000) } };
const limits = { free: 1, essentiel: 5, business: 10 };
const site = { accessMatrix: {
  classifieds: { monthlyPosts: limits, maxPhotos: limits },
  jobs: { monthlyPosts: limits },
  tenders: { monthlyPosts: limits, minimumPlan: "business", responseMinimumPlan: "business" },
} };

test("attend les prix et les quotas avant de les afficher", async ({ page }) => {
  test.setTimeout(90000);
  let releaseSite!: () => void;
  const siteReady = new Promise<void>((resolve) => { releaseSite = resolve; });
  await page.route("**/api/billing/subscription-pricing?*", (route) => route.fulfill({ json: pricing }));
  await page.route((url) => url.pathname === "/api/public/site-config" && url.searchParams.get("strict") === "1", async (route) => {
    await siteReady;
    await route.fulfill({ json: site });
  });

  await page.goto("/tarifs");
  await expect(page.getByRole("status").filter({ hasText: "Chargement des tarifs" })).toBeAttached();
  await expect(page.getByRole("button", { name: "Chargement..." })).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Chargement..." }).first()).toBeDisabled();
  await expect(page.getByText(/15\s*000\s*Ar/)).toHaveCount(0);
  await expect(page.getByText(/0 annonces/)).toHaveCount(0);
  releaseSite();
  const essential = page.locator("article").filter({ has: page.getByRole("heading", { name: "ESSENTIEL" }) });
  await expect(essential).toContainText(/18\s*000\s*Ar/);
  await expect(essential).toContainText("5 annonces / mois");
  await expect(essential).toContainText("5 photos / annonce");
  await expect(essential).toContainText("5 offres d'emploi / mois");
});

test("affiche un message simple si la configuration est indisponible", async ({ page }) => {
  test.setTimeout(90000);
  await page.route("**/api/billing/subscription-pricing?*", (route) => route.fulfill({ json: pricing }));
  await page.route((url) => url.pathname === "/api/public/site-config" && url.searchParams.get("strict") === "1", (route) => {
    return route.fulfill({ status: 503 });
  });
  await page.goto("/tarifs");
  await expect(page.getByRole("alert").filter({ hasText: "Un problème est survenu" })).toBeVisible();
  await expect(page.getByText(/15\s*000\s*Ar/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Réessayer" })).toHaveCount(0);
  const unavailableButtons = page.getByRole("button", { name: "Indisponible" });
  await expect(unavailableButtons).toHaveCount(3);
  for (const button of await unavailableButtons.all()) await expect(button).toBeDisabled();
});
