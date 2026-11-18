import { expect, test } from "@playwright/test";

const publicRoutes = [
  ["/", /2424|actualit/i],
  ["/actualites", /actualit/i],
  ["/news", /fil d.info|news/i],
  ["/petites-annonces", /petites annonces/i],
  ["/offres-emploi", /offres d.emploi|offres emploi/i],
  ["/appels-offres", /appels d.offres|appel d.offre/i],
  ["/annuaire", /annuaire/i],
  ["/tarifs", /tarifs|free|essentiel/i],
] as const;

test.describe("@smoke @public parcours publics critiques", () => {
  for (const [route, title] of publicRoutes) {
    test(`${route} reste navigable`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).toContainText(title);
    });
  }

  test("la page inconnue rend une 404 explicite", async ({ page }) => {
    await page.goto("/route-inconnue-test");
    await expect(page.locator("body")).toContainText(/404|introuvable/i);
  });
});
