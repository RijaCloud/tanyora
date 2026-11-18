import { expect, test } from "@playwright/test";

test.describe("Email verification banner flow", () => {
  async function signupViaUi(page: import("@playwright/test").Page, email: string, password: string) {
    await page.goto("/signin");
    await page.getByRole("button", { name: /s'inscrire par email/i }).click();
    await page.getByLabel(/^Email$/i).fill(email);
    await page.getByLabel(/^Mot de passe$/i).fill(password);
    await page.getByLabel(/Confirmer le mot de passe/i).fill(password);
    await page.getByRole("button", { name: /^S'inscrire$/i }).click();
  }

  test("keeps the verification banner hidden during email onboarding", async ({ page }) => {
    test.setTimeout(90000);

    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `playwright+verify-${unique}@example.com`;
    const password = "Strong2424!Pass";

    await signupViaUi(page, email, password);

    await expect(page).toHaveURL(/\/onboarding\?method=email/i, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: /creez votre profil 2424\.mg/i })).toBeVisible();
    await expect(page.getByText(/Votre adresse email n'est pas encore verifiee/i)).toHaveCount(0);
  });

  test("completes onboarding then shows verification banner on home", async ({ page }) => {
    test.setTimeout(120000);

    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `playwright+verify-home-${unique}@example.com`;
    const password = "Strong2424!Pass";

    const bootstrapSignupResponse = await page.request.post("/api/auth/signup", {
      data: { email, password },
    });
    expect(bootstrapSignupResponse.ok()).toBeTruthy();

    await page.goto("/onboarding?method=email");
    await expect(page.getByRole("heading", { name: /creez votre profil 2424\.mg/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveValue(email, { timeout: 20000 });

    const lastNameInput = page.locator('input[name="lastName"]');
    const firstNameInput = page.locator('input[name="firstName"]');
    await lastNameInput.fill("Rakoto");
    await firstNameInput.fill("Nirina");
    await expect(lastNameInput).toHaveValue("Rakoto");
    await expect(firstNameInput).toHaveValue("Nirina");

    const phoneInput = page.locator(".phone-picker-shell input").first();
    await phoneInput.click();
    await phoneInput.press("Control+A");
    await phoneInput.type("+261341234567");
    await phoneInput.blur();

    const submitButton = page.getByRole("button", { name: "Enregistrer" });
    await expect(submitButton).toBeEnabled({ timeout: 20000 });
    await submitButton.click();

    await expect(page).toHaveURL("/", { timeout: 30000 });
    await expect(
      page.getByText(/Votre adresse email n'est pas encore verifiee/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows an error when signup email already exists", async ({ page }) => {
    test.setTimeout(90000);

    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `playwright+exists-${unique}@example.com`;
    const password = "Strong2424!Pass";

    const bootstrapSignupResponse = await page.request.post("/api/auth/signup", {
      data: { email, password },
    });
    expect(bootstrapSignupResponse.ok()).toBeTruthy();
    await page.context().clearCookies();

    await signupViaUi(page, email, password);

    await expect(page.getByText("Cet email est deja utilise. Essayez de vous connecter.")).toBeVisible({
      timeout: 10000,
    });
    await expect(page).toHaveURL(/\/signin/i);
  });
});
