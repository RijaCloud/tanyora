import { expect, test } from "@playwright/test";

test.describe("Onboarding", () => {
  test("shows the local signup form and keeps submit disabled until the form is valid", async ({ page }) => {
    await page.goto("/onboarding?method=email");

    await expect(page.getByRole("heading", { name: /créez votre profil 2424\.mg/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/^Mot de passe \*/i)).toBeVisible();

    for (const label of ["Nom", "Prénom", "Email", "Numéro de téléphone", "Mot de passe", "Confirmer le mot de passe"]) {
      const requiredLabel = page.locator("label").filter({ hasText: new RegExp(`^${label} \\*`) }).locator("span").first();
      await expect(requiredLabel).toHaveClass(/text-\[#EA2828\]/);
    }

    const submitButton = page.getByRole("button", { name: "Enregistrer" });
    await expect(submitButton).toBeDisabled();

    await page.getByLabel(/^Nom \*/i).fill("Rakoto");
    await page.getByLabel(/^Prénom \*/i).fill("Nirina");
    await page.getByLabel(/^Email \*/i).fill("playwright2424test@example.com");
    const phoneInput = page.locator(".phone-picker-shell input").first();
    await phoneInput.click();
    await phoneInput.press("End");
    await phoneInput.pressSequentially("341234567");
    await page.getByLabel(/^Mot de passe \*/i).fill("Strong2424!Pass");
    await page.getByLabel(/Confirmer le mot de passe/i).fill("Strong2424!Pass");
    await page.getByLabel("Date de naissance").fill("12/08/2000");

    await expect(page.getByText("Email disponible")).toBeVisible();
    await expect(submitButton).not.toBeDisabled({ timeout: 10000 });
  });
});
