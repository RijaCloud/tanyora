import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { expect, test } from "@playwright/test";

type SessionUser = {
  wpUserId: number;
  email: string;
  name: string;
  username?: string;
  role?: string;
  emailVerified?: boolean;
  picture?: string | null;
  authProvider?: "local" | "google";
  onboardingCompleted?: boolean;
  planId?: "free" | "essentiel" | "business";
  subscriptionStatus?: "none" | "active" | "cancelled";
};

function getSessionSecret() {
  if (process.env.APP_SESSION_SECRET || process.env.AUTH0_SECRET) {
    return process.env.APP_SESSION_SECRET || process.env.AUTH0_SECRET || "2424-local-session-secret";
  }

  try {
    const envPath = join(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf8");
    const appSecretMatch = envContent.match(/^APP_SESSION_SECRET=(.+)$/m);
    if (appSecretMatch?.[1]) {
      return appSecretMatch[1].trim().replace(/^"|"$/g, "");
    }
    const auth0SecretMatch = envContent.match(/^AUTH0_SECRET=(.+)$/m);
    if (auth0SecretMatch?.[1]) {
      return auth0SecretMatch[1].trim().replace(/^"|"$/g, "");
    }
  } catch {
    // fallback below
  }

  return "2424-local-session-secret";
}

function serializeSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

test.describe("Classified checkout flow", () => {
  test("creates a classified and reaches checkout step", async ({ page, context, baseURL }) => {
    test.setTimeout(180000);

    const runId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `playwright-classified-${runId}@example.com`;
    const password = "Strong2424!Pass";
    const title = `Annonce test checkout ${runId}`;

    const signupResponse = await page.request.post("/api/auth/signup", {
      data: { email, password },
    });
    expect(signupResponse.ok()).toBeTruthy();
    const signupPayload = (await signupResponse.json()) as {
      user?: { wpUserId: number; email: string; name: string; username?: string; role?: string };
    };
    expect(signupPayload.user?.wpUserId).toBeTruthy();

    const sessionToken = serializeSession({
      wpUserId: signupPayload.user!.wpUserId,
      email: signupPayload.user!.email,
      name: signupPayload.user!.name || "Playwright User",
      username: signupPayload.user!.username,
      role: signupPayload.user!.role || "subscriber",
      emailVerified: true,
      picture: null,
      authProvider: "local",
      onboardingCompleted: true,
      planId: "free",
      subscriptionStatus: "none",
    });

    await context.addCookies([
      {
        name: "2424_session",
        value: sessionToken,
        url: baseURL || "http://127.0.0.1:3000",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/profil/petites-annonces");
    await expect(page).toHaveURL(/\/profil\/petites-annonces/);

    await page.getByRole("button", { name: /Créer une annonce/i }).click();
    await page.getByLabel(/Titre de l'annonce/i).fill(title);
    await page.getByLabel(/Categorie/i).selectOption({ index: 1 });
    await page.getByLabel(/^Lieu$/i).fill("Antananarivo");

    const listingPhone = page.locator(".phone-picker-shell input").last();
    await listingPhone.click();
    await listingPhone.press("Control+A");
    await listingPhone.type("+261341112233");
    await listingPhone.blur();

    await page.getByLabel(/^Prix$/i).fill("850000");
    await page
      .getByLabel(/Description/i)
      .fill(
        "Annonce de test Playwright pour verifier le flow de paiement. Cette description est volontairement longue pour depasser le minimum requis et reproduire un cas reel de publication utilisateur.",
      );

    const createApiResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/submissions/classified") &&
        response.request().method() === "POST",
      { timeout: 120000 },
    );

    await page.getByRole("button", { name: /Enregistrer cet element/i }).click();

    const createApiResponse = await createApiResponsePromise;
    expect(createApiResponse.ok()).toBeTruthy();

    await expect(page.getByText(title).first()).toBeVisible({ timeout: 45000 });

    const payNowButton = page.getByRole("button", { name: /Payer maintenant/i }).first();
    await expect(payNowButton).toBeVisible({ timeout: 30000 });
    await payNowButton.click();

    await expect(page).toHaveURL(/\/checkout\/listing\?/i, { timeout: 30000 });

    const checkoutApiResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/billing/checkout/listing") &&
        response.request().method() === "POST",
      { timeout: 60000 },
    );

    await page.getByRole("button", { name: /Continuer vers le paiement/i }).click();

    const checkoutApiResponse = await checkoutApiResponsePromise;
    expect(checkoutApiResponse.ok()).toBeTruthy();
  });
});
