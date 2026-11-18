import { expect, test } from "@playwright/test";

async function pageHasVisibleText(page: import("@playwright/test").Page, pattern: RegExp): Promise<boolean> {
  const source = pattern.source;
  const flags = pattern.flags;

  return page.evaluate(
    ({ source, flags }) => {
      const matcher = new RegExp(source, flags);
      const nodes = Array.from(document.querySelectorAll("body *"));
      return nodes.some((node) => {
        if (!(node instanceof HTMLElement)) {
          return false;
        }
        const text = node.innerText || node.textContent || "";
        if (!matcher.test(text)) {
          return false;
        }
        const style = window.getComputedStyle(node);
        const hidden = style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
        const hasBox = node.getClientRects().length > 0;
        return !hidden && hasBox;
      });
    },
    { source, flags },
  );
}

async function expectPublicListingPageBasics(
  page: import("@playwright/test").Page,
  url: string,
  titlePattern: RegExp,
) {
  await page.goto(url);

  await expect(page).toHaveURL(new RegExp(`${url.replace("/", "\\/")}`));

  const hasTitle = await pageHasVisibleText(page, titlePattern);
  expect(hasTitle).toBeTruthy();

  const hasCategories = await pageHasVisibleText(page, /Categories|Cat.egories/i);
  expect(hasCategories).toBeTruthy();

  const imageCount = await page.locator("img:visible").count();
  expect(imageCount).toBeGreaterThan(0);
}

test.describe("Public listings pages", () => {
  test("petites annonces page renders", async ({ page }) => {
    await expectPublicListingPageBasics(page, "/petites-annonces", /petites annonces/i);
  });

  test("offres emploi page renders", async ({ page }) => {
    await expectPublicListingPageBasics(page, "/offres-emploi", /offres d'emploi|offres emploi/i);
  });

  test("appels offres page renders", async ({ page }) => {
    await expectPublicListingPageBasics(page, "/appels-offres", /appel d'offres|appels d'offres/i);
  });
});
