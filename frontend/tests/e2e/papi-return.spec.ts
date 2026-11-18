import { expect, test } from "@playwright/test";

test.setTimeout(90000);

test("confirmed payment opens the profile while session refresh is still running", async ({ page }) => {
  const sessionResponse = await page.request.post("/api/e2e/session", { data: { name: "Payment Test" } });
  expect(sessionResponse.ok()).toBeTruthy();
  const { user } = await sessionResponse.json();
  let releaseRefresh!: () => void;
  const refreshGate = new Promise<void>((resolve) => { releaseRefresh = resolve; });
  let refreshStarted = false;

  await page.route("**/api/billing/papi/status", (route) => route.fulfill({
    json: { orderId: 123, isConfirmed: true, status: "paid", planId: "business" },
  }));
  await page.route("**/api/auth/me?refresh=1", async (route) => {
    refreshStarted = true;
    await refreshGate;
    await route.fulfill({ json: { user: { ...user, planId: "business", subscriptionStatus: "active" } } });
  });

  try {
    await page.goto("/checkout/retour?order_id=123&key=test-key&plan=business");
    await expect.poll(() => refreshStarted).toBe(true);
    await expect(page).toHaveURL(/\/profil(?:\?|$)/, { timeout: 30000 });
  } finally {
    releaseRefresh();
  }
  await expect.poll(() => page.evaluate(() => localStorage.getItem("auth-plan")), { timeout: 30000 }).toBe("business");
});

test("an unsuccessful payment never triggers session activation", async ({ page }) => {
  const sessionResponse = await page.request.post("/api/e2e/session", { data: { name: "Payment Test" } });
  expect(sessionResponse.ok()).toBeTruthy();
  let refreshStarted = false;
  await page.route("**/api/billing/papi/status", (route) => route.fulfill({
    json: { orderId: 123, isConfirmed: false, status: "failed", planId: "business" },
  }));
  await page.route("**/api/auth/me?refresh=1", (route) => {
    refreshStarted = true;
    return route.abort();
  });

  await page.goto("/checkout/retour?order_id=123&key=test-key&plan=business");
  await expect(page.getByText("Le paiement a été refusé ou annulé.")).toBeVisible();
  await expect(page).toHaveURL(/\/checkout\/retour/);
  expect(refreshStarted).toBe(false);
});

test("session refresh failures do not disconnect the customer or grant a plan", async ({ page }) => {
  const sessionResponse = await page.request.post("/api/e2e/session", { data: { name: "Payment Test" } });
  expect(sessionResponse.ok()).toBeTruthy();
  let refreshAttempts = 0;
  await page.route("**/api/billing/papi/status", (route) => route.fulfill({
    json: { orderId: 123, isConfirmed: true, status: "paid", planId: "business" },
  }));
  await page.route("**/api/auth/me?refresh=1", (route) => {
    refreshAttempts += 1;
    return route.fulfill({ status: 503, json: { error: "Temporarily unavailable" } });
  });

  await page.goto("/checkout/retour?order_id=123&key=test-key&plan=business");
  await expect(page).toHaveURL(/\/profil(?:\?|$)/, { timeout: 30000 });
  await expect.poll(() => refreshAttempts).toBe(3);
  await expect(page.getByRole("heading", { name: "Bonjour Payment Test" })).toBeVisible({ timeout: 30000 });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("auth-plan"))).toBe("free");
  await expect(page).not.toHaveURL(/\/login/);
});
