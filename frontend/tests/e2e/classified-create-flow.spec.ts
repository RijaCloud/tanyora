import { expect, test } from "@playwright/test";

test.describe("Classified creation flow", () => {
  test("connexion > dropdown > petites annonces > creer annonce sans image > save > voir page petites annonces", async ({
    page,
  }) => {
    const runId = Date.now();
    const email = `playwright-${runId}@example.com`;
    const password = `Strong${runId}!Aa`;
    const username = `user${String(runId).slice(-8)}`;
    const title = `Annonce test ${runId}`;

    await page.goto("/signin");
    await page.getByRole("button", { name: /s'inscrire par email/i }).click();
    await page.getByLabel(/^Email$/i).fill(email);
    await page.getByLabel(/^Mot de passe$/i).fill(password);
    await page.getByLabel(/Confirmer le mot de passe/i).fill(password);
    await page.getByRole("button", { name: /S'inscrire/i }).click();

    await page.waitForURL(/\/onboarding/i, { timeout: 30000 });

    const usernameInput = page.getByLabel(/Nom d'utilisateur/i);
    await usernameInput.click();
    await usernameInput.press("Control+A");
    await usernameInput.press("Backspace");
    await usernameInput.fill(username);
    await page.getByLabel(/^Nom \*/i).fill("Play");
    await page.getByLabel(/^Prenom \*/i).fill("Wright");
    const phoneInput = page.locator(".phone-picker-shell input").first();
    await phoneInput.click();
    await phoneInput.press("End");
    await phoneInput.pressSequentially("341234567");

    await page.getByLabel("Date de naissance").fill("12/08/2000");

    const onboardingSubmit = page.getByRole("button", { name: "Enregistrer" });
    await expect(onboardingSubmit).toBeEnabled({ timeout: 30000 });
    await onboardingSubmit.click();
    await page.waitForURL((url) => !url.pathname.startsWith("/onboarding"), { timeout: 30000 });

    await page.goto("/");

    const accountButton = page.getByRole("button", { name: /Mon compte|Nouveau Compte|free|Play|Wright|pwuser/i }).first();
    await accountButton.click();
    await page.locator("a[href='/profil/petites-annonces']").first().click();
    await page.waitForURL(/\/profil\/petites-annonces/i, { timeout: 30000 });

    await page.getByRole("button", { name: /Créer une annonce/i }).click();
    await page.getByLabel(/Titre de l'annonce/i).fill(title);
    await page.getByLabel(/Categorie/i).selectOption({ index: 1 });
    await page.getByLabel(/^Lieu$/i).fill("Antananarivo");

    const listingPhone = page.locator(".phone-picker-shell input").last();
    await listingPhone.click();
    await listingPhone.press("End");
    await listingPhone.pressSequentially("341112233");

    await page.getByLabel(/^Prix$/i).fill("850 000 Ar");
    await page.getByLabel(/^Description$/i).fill("Annonce de test Playwright sans image.");
    await page.getByRole("button", { name: /Enregistrer cet element/i }).click();

    await expect(page.getByText(title).first()).toBeVisible({ timeout: 20000 });

    await page.goto("/petites-annonces");
    await expect(page).toHaveURL(/\/petites-annonces/);
    await expect(page.locator("main, body").first()).toBeVisible();
  });
});
