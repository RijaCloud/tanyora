import { expect, test } from "@playwright/test";

const flashFeed = {
  articles: [
    {
      id: "news-1",
      title: "Une information de test pour le fil défilant",
      slug: "information-test",
      publishedAt: "2026-09-11T09:00:00.000Z",
      category: "news",
      source: "news",
    },
    {
      id: "news-2",
      title: "Une seconde information pour la boucle continue",
      slug: "seconde-information-test",
      publishedAt: "2026-09-11T08:00:00.000Z",
      category: "news",
      source: "news",
    },
  ],
};

test("flash info runs normally and pauses only while it is being read", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/api/news/feed?*", (route) => route.fulfill({ json: flashFeed }));
  await page.goto("/");

  const ticker = page.locator(".animate-scroll");
  await expect(ticker).toHaveCSS("animation-play-state", "running");

  await ticker.dispatchEvent("mouseover");
  await expect(ticker).toHaveCSS("animation-play-state", "paused");

  await ticker.dispatchEvent("mouseout");
  await expect(ticker).toHaveCSS("animation-play-state", "running");

  await ticker.getByRole("link").first().focus();
  await expect(ticker).toHaveCSS("animation-play-state", "paused");

});

test("listing filters stay sticky on desktop and return to normal flow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const path of ["/petites-annonces", "/offres-emploi", "/appel-offres", "/annuaire"]) {
    await page.goto(path);
    await expect(page.locator(".prototype-listing-sidebar").first()).toHaveCSS("position", "sticky");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/petites-annonces");
  await page.getByRole("button", { name: "Afficher les filtres" }).click();
  await expect(page.locator(".prototype-listing-sidebar").first()).not.toHaveCSS("position", "sticky");
});

test("editorial story focus updates the associated large image", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/actualites");

  const stories = page.getByTestId("editorial-story-trigger");
  await expect(stories.nth(1)).toBeVisible();
  await stories.nth(1).locator("a").first().focus();
  await expect(stories.nth(1)).toHaveAttribute("data-active", "true");
  await expect(page.getByTestId("editorial-story-image").first().locator("img")).toHaveAttribute(
    "alt",
    await stories.nth(1).getByRole("heading").innerText(),
  );
});
